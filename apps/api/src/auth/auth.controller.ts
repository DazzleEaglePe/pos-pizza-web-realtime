import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.authService.login(user);
  }

  // Temporary endpoint to bypass creating a seed just for testing
  @Post('register')
  async register(@Body() loginDto: LoginDto) {
    return this.authService.register(loginDto.email, loginDto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@Request() req: any, @Body() body: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, body.name);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('email')
  updateEmail(@Request() req: any, @Body() body: UpdateEmailDto) {
    return this.authService.updateEmail(req.user.id, body.email);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(@Request() req: any, @Body() body: ChangePasswordDto) {
    await this.authService.changePassword(req.user.id, body);
    return { success: true, forceRelogin: true };
  }
}
