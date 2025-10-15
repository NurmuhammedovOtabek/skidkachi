import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Bot } from "./models/bot.model";
import { InjectBot } from "nestjs-telegraf";
import { BOT_NAME } from "../app.constants";
import { Context, Markup, Telegraf } from "telegraf";

@Injectable()
export class BotService {
  constructor(
    @InjectModel(Bot) private readonly botModel: typeof Bot,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>
  ) {}

  async start(ctx: Context) {
    try {
    } catch (error) {
      console.log(error);
    }
    const user_id = ctx.from!.id;
    const user = await this.botModel.findByPk(user_id);
    if (!user) {
      await this.botModel.create({
        user_id,
        username: ctx.from!.username,
        first_name: ctx.from!.first_name,
        last_name: ctx.from!.last_name,
        language_code: ctx.from!.language_code,
      });
      await ctx.replyWithHTML(
        `iltimos,<b> telefon raqamingizni kriting</b> tugmani bosing`,
        {
          ...Markup.keyboard([
            [Markup.button.contactRequest(`telefon raqamingizni kriting`)],
          ])
            .oneTime()
            .resize(),
        }
      );
    } else if (!user.is_active) {
      await ctx.replyWithHTML(
        `iltimos,<b> telefon raqamingizni kriting</b> tugmani bosing`,
        {
          ...Markup.keyboard([
            [Markup.button.contactRequest(`telefon raqamingizni kriting`)],
          ])
            .oneTime()
            .resize(),
        }
      );
    } else {
      await ctx.replyWithHTML(
        `Bu bot orqali \skidkachi tizimida faoliyat olib boradigan Magazin egalari uchun`,
        {
          ...Markup.removeKeyboard(), // keyinchalik ovner buttonlari chqariladi
        }
      );
    }
  }

  async onContact(ctx: Context) {
    try {
      if ("contact" in ctx.message!) {
        const user_id = ctx.from!.id;
        const user = await this.botModel.findByPk(user_id);
        if (!user) {
          await ctx.replyWithHTML("/start", {
            ...Markup.keyboard([[(`/start`)]])
              .oneTime()
              .resize(),
          });
        } else if (ctx.message.contact.user_id != user_id) {
          await ctx.replyWithHTML(
            "O'zingizni telefoni raqaminginzni jonating",
            {
              ...Markup.keyboard([
                [Markup.button.contactRequest(`telefon raqamingizni kriting`)],
              ])
                .oneTime()
                .resize(),
            }
          );
        } else {
          const phone = ctx.message.contact.phone_number;
          user.is_active = true;
          user.phone_number = phone[0] == "+" ? phone : "+" + phone;
          await user.save();
          await ctx.replyWithHTML("tabriklaymiz royxatdan otdingiz", {
            ...Markup.removeKeyboard(),
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  async onStop(ctx: Context) {
    try {
      const user_id = ctx.from!.id;
      const user = await this.botModel.findByPk(user_id);
      await this.bot.telegram.sendMessage(user_id,"xayr")

      if (user) {
        user.is_active = false;
        await user.save();
        await ctx.replyWithHTML(
          "siz botda foaliyatingizni tixtadingiz /start ni bosing",
          {
            ...Markup.keyboard([[(`/start`)]])
              .oneTime()
              .resize(),
          }
        );
      }
    } catch (error) {
      console.log(error);
    }
  }

  async sendOtp(phone_number: string, otp: string){
    try{
      const user = await this.botModel.findOne({where:{phone_number}});
      if(!user || !user.is_active){
        return false
      }

      await this.bot.telegram.sendMessage(user.user_id, `verify code: `+ otp)
      return true
    }catch(error){
      console.log(error);
      
    }
  }
}
