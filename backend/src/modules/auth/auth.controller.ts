import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto, LoginCredentialsDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth & Registration')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  @ApiOperation({ summary: 'Telefon raqamga SMS tasdiqlash kodi yuborish' })
  @ApiResponse({ status: 200, description: 'SMS kod yuborildi' })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phone);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'SMS kodni tekshirish va JWT token olish' })
  @ApiResponse({ status: 200, description: 'JWT accessToken va user ma‘lumotlari' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.code, dto.role, dto.inn);
  }

  @Post('login-credentials')
  @ApiOperation({ summary: 'Login va parol orqali tizimga kirish (Admin va Super Admin)' })
  @ApiResponse({ status: 200, description: 'JWT accessToken va admin ma‘lumotlari' })
  loginCredentials(@Body() dto: LoginCredentialsDto) {
    return this.authService.loginWithCredentials(dto.login, dto.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Joriy foydalanuvchi ma‘lumotlarini olish (JWT orqali)' })
  getProfile(@CurrentUser() user: any) {
    return {
      success: true,
      user,
    };
  }
}
