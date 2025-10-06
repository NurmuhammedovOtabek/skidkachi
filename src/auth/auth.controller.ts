import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginUserDto } from '../users/dto/login.dto';
import type { Response } from 'express';

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post("registration")
  registration(@Body() createUserDto: CreateUserDto) {
    return this.authService.registration(createUserDto);
  }

  @Post("login")
  login(@Body() loginUserDto: LoginUserDto,
  @Res({passthrough: true}) res:Response
  ) {
    return this.authService.login(loginUserDto, res);
  }
}
