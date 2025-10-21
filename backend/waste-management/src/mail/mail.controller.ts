import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { MailService } from './mail.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get('test-config')
  async testEmailJSConfig() {
    try {
      // This will trigger the EmailJS validation and show detailed logs
      await this.mailService['validateConfiguration']();
      return {
        status: 'success',
        message: 'EmailJS configuration is valid',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('test-send')
  @UseGuards(JwtAuthGuard)
  async testSendEmail(@Body() body: { email: string }) {
    try {
      await this.mailService.sendEmail({
        to: body.email,
        subject: 'SMTP Test Email',
        template: 'test-email',
        context: {
          testMessage: 'This is a test email to verify SMTP configuration',
          timestamp: new Date().toISOString()
        }
      });

      return {
        status: 'success',
        message: 'Test email sent successfully',
        to: body.email,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
