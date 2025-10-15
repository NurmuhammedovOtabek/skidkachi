import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './models/user.model';
import bcrypt from "bcrypt";
import { MailService } from '../mail/mail.service';
import { PhoneUserDto } from './dto/phone-user.dto';
import otpGenetator from "otp-generator"
import { BotService } from '../bot/bot.service';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User) private readonly userModel: typeof User,
  private readonly mailService: MailService,
  private readonly botService: BotService
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { password, confirm_password } = createUserDto;
    if (password !== confirm_password) {
      throw new BadRequestException({ message: "Parollar mos emas" });
    }
    const hashedPassword = await bcrypt.hash(password,7)
    // createUserDto.password = hashedPassword
    const user = await this.userModel.create({...createUserDto, password:hashedPassword});

    try{
      await this.mailService.sendMail(user)
    }catch(error){
      throw new ServiceUnavailableException("Emailga hat yuboshirda xatolik")
    }
    return user;
  }

  async findAll() {
    return this.userModel.findAll();
  }

  async findByEmail(email: string) {
    const user = await this.userModel.findOne({
      where: { email }
    });
    return user
  }

  findOne(id: number) {
    return this.userModel.findByPk(id);
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async activateUser(link:string){
    if(!link){
      throw new BadRequestException("Activation link not found")
    }
    const updateUser = await this.userModel.update(
      {is_active: true},
      {where:{
        activation_link: link,
        is_active:false
      },
      returning:true
    }
    )
    if(!updateUser[1][0]){
      throw new BadRequestException("User already activetes")
    }
    return {
      message:"User activated successFully",
      is_active: updateUser[1][0].is_active
    }
  }

  async newOtp(phoneUserDto: PhoneUserDto){
    const phone_number = phoneUserDto.phone_number
    const opt = otpGenetator.generate(4,{
      upperCaseAlphabets:false,
      lowerCaseAlphabets:false,
      specialChars:false
    })
    const isSend = await this.botService.sendOtp(phone_number, opt)
    if(!isSend){
      throw new BadRequestException("Avval botda royxatdan oting")
    }
    return {
      message: "Botga otp yuborildi"
    }
  }
}
