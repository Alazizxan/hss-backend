import {
    Injectable,
    OnModuleInit,
    Logger,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

import {
    Telegraf,
    Markup,
} from "telegraf";

import {
    ADMIN_IDS,
    SUPPORT_IDS,
    PAYMENT_CARDS,
    PREMIUM_PRICES,
} from "./constants";

import {
    sessions,
} from "./sessions";

@Injectable()
export class TelegramService implements OnModuleInit {
    private readonly logger =
        new Logger(TelegramService.name);

    private bot: Telegraf;


    private adminReplyMap =
        new Map<number, number>();

    constructor(
        private readonly prisma: PrismaService,
    ) {
        console.log(
            "TelegramService instance:",
            Math.random(),
        );

        this.bot = new Telegraf(
            process.env.TELEGRAM_BOT_TOKEN!,
        );
    }



    async onModuleInit() {
        console.log(
            "BOT STARTING"
        );

        await this.registerHandlers();

        console.log(
            "HANDLERS REGISTERED"
        );

        this.bot.launch()
            .then(() => {
                console.log(
                    "BOT STARTED"
                );
            })
            .catch((err) => {
                console.error(
                    err,
                );
            });
    }

    async onModuleDestroy() {
        this.bot.stop();
    }
    private async registerHandlers() {
        this.bot.start(async (ctx) => {
            await ctx.reply(
                `
👋 HSS Academy botiga xush kelibsiz

Bu yerda siz:

⭐ Premium sotib olishingiz
💬 Support bilan bog'lanishingiz
👑 Premium holatini tekshirishingiz mumkin
        `,
                Markup.keyboard([
                    ["⭐ Premium sotib olish"],
                    ["👑 Premium holatim"],
                    ["💬 Support"],
                ])
                    .resize()
                    .persistent(),
            );
        });

        this.bot.hears(
            "👑 Premium holatim",
            async (ctx) => {
                const session =
                    sessions.get(ctx.from.id);

                if (
                    !session?.selectedUserId
                ) {
                    return ctx.reply(
                        "Avval premium sotib olish bo'limidan akkauntingizni bog'lang."
                    );
                }

                const user =
                    await this.prisma.user.findUnique({
                        where: {
                            id: session.selectedUserId,
                        },
                    });

                if (
                    !user ||
                    !user.isPremium
                ) {
                    return ctx.reply(
                        "❌ Premium mavjud emas."
                    );
                }

                await ctx.reply(
                    `
👑 Premium aktiv

📅 Tugash sanasi:
${user.premiumUntil?.toLocaleDateString()}
      `,
                );
            },
        );

        this.bot.hears(
            "⭐ Premium sotib olish",
            async (ctx) => {
                sessions.set(ctx.from.id, {
                    step: "WAIT_USER",
                });

                await ctx.reply(
                    `
📧 Email yoki username kiriting.

Misol:

ali@gmail.com

yoki

hacker_ali
      `,
                );
            },
        );

        this.bot.hears(
            "💬 Support",
            async (ctx) => {
                const session =
                    sessions.get(ctx.from.id) || {};

                session.activeSupport = true;

                sessions.set(
                    ctx.from.id,
                    session,
                );

                await ctx.reply(`
💬 Support rejimi yoqildi.

Muammoingizni yozing.

Chiqish uchun:

/close
    `);
            },
        );


        this.bot.command(
            "close",
            async (ctx) => {
                const session =
                    sessions.get(ctx.from.id);

                if (!session) {
                    return;
                }

                session.activeSupport =
                    false;

                sessions.delete(
                    ctx.from.id,
                );

                await ctx.reply(
                    "✅ Support sessiyasi yopildi."
                );
            },
        );


        this.bot.on(
            "text",
            async (ctx) => {
                const session =
                    sessions.get(ctx.from.id);

                // ADMIN REPLY
                if (
                    this.adminReplyMap.has(
                        ctx.from.id,
                    )
                ) {
                    const targetUserId =
                        this.adminReplyMap.get(
                            ctx.from.id,
                        );

                    try {
                        await this.bot.telegram.sendMessage(
                            targetUserId!,
                            `
💬 Support javobi

${ctx.message.text}
                `,
                        );
                    } catch (e) {
                        console.error(e);
                    }
                    await ctx.reply(
                        "✅ Javob yuborildi."
                    );

                    this.adminReplyMap.delete(
                        ctx.from.id,
                    );

                    return;
                }

                // SUPPORT MESSAGE
                if (
                    session?.activeSupport
                ) {
                    for (
                        const supportId of SUPPORT_IDS
                    ) {
                        try {
                            await this.bot.telegram.sendMessage(
                                supportId,
                                `
🆘 Yangi support xabari

👤 @${ctx.from.username || ctx.from.first_name}

🆔 ${ctx.from.id}

✉️ ${ctx.message.text}
                    `,
                                {
                                    reply_markup: {
                                        inline_keyboard: [
                                            [
                                                {
                                                    text: "✍️ Javob berish",
                                                    callback_data:
                                                        `reply_${ctx.from.id}`,
                                                },
                                            ],
                                        ],
                                    },
                                },
                            );
                        } catch (e) {
                            console.error(e);
                        }

                    }

                    await ctx.reply(
                        "✅ Xabaringiz supportga yuborildi."
                    );

                    return;
                }

                // PREMIUM SEARCH
                if (
                    session?.step ===
                    "WAIT_USER"
                ) {
                    const input =
                        ctx.message.text.trim();

                    const user =
                        await this.prisma.user.findFirst({
                            where: {
                                OR: [
                                    {
                                        email:
                                            input,
                                    },
                                    {
                                        username:
                                            input,
                                    },
                                ],
                            },
                        });

                    if (!user) {
                        return ctx.reply(
                            "❌ Foydalanuvchi topilmadi."
                        );
                    }

                    sessions.set(
                        ctx.from.id,
                        {
                            ...session,
                            selectedUserId:
                                user.id,
                            emailOrUsername:
                                input,
                            step:
                                "WAIT_PACKAGE",
                        },
                    );

                    await ctx.reply(
                        `
✅ Akkaunt topildi

👤 ${user.username}
📧 ${user.email}
                `,
                    );

                    return;
                }
            },
        );

        this.bot.action(
            /^premium_(\d+)$/,
            async (ctx) => {
                const months =
                    Number(ctx.match[1]);

                const session =
                    sessions.get(ctx.from.id);

                if (!session) {
                    return ctx.reply(
                        "Session topilmadi."
                    );
                }

                session.selectedMonths =
                    months;

                session.waitingReceipt =
                    true;

                sessions.set(
                    ctx.from.id,
                    session,
                );

                await ctx.reply(
                    `
⭐ Premium tanlandi

Muddat:
${months} oy

Narxi:
${PREMIUM_PRICES[months]} so'm

${PAYMENT_CARDS}

📷 To'lov chekini yuboring.
      `,
                );
            },
        );


        this.bot.on(
            "photo",
            async (ctx) => {
                const session =
                    sessions.get(ctx.from.id);

                if (
                    !session?.waitingReceipt
                ) {
                    return;
                }

                const photo =
                    ctx.message.photo[
                    ctx.message.photo.length - 1
                    ];

                for (
                    const adminId of ADMIN_IDS
                ) {
                    await this.bot.telegram.sendPhoto(
                        adminId,
                        photo.file_id,
                        {
                            caption: `
🆕 PREMIUM SO'ROVI

Telegram:
@${ctx.from.username || ctx.from.first_name}

Telegram ID:
${ctx.from.id}

User:
${session.emailOrUsername}

Muddat:
${session.selectedMonths} oy
          `,
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: "✅ Tasdiqlash",
                                            callback_data:
                                                `approve_${ctx.from.id}`,
                                        },
                                    ],
                                    [
                                        {
                                            text: "❌ Bekor qilish",
                                            callback_data:
                                                `reject_${ctx.from.id}`,
                                        },
                                    ],
                                ],
                            },
                        },
                    );
                }

                await ctx.reply(
                    `
✅ Chek qabul qilindi.

Administrator tekshirayotganidan so'ng premium aktivlashtiriladi.
      `,
                );

                session.waitingReceipt =
                    false;

                sessions.set(
                    ctx.from.id,
                    session,
                );
            },
        );

        this.bot.action(
            /^approve_(\d+)$/,
            async (ctx) => {
                const telegramId =
                    Number(ctx.match[1]);

                const session =
                    sessions.get(
                        telegramId,
                    );

                if (!session) {
                    return ctx.reply(
                        "Session topilmadi."
                    );
                }

                const user =
                    await this.prisma.user.findUnique({
                        where: {
                            id: session.selectedUserId,
                        },
                    });

                if (!user) {
                    return ctx.reply(
                        "User topilmadi."
                    );
                }

                const until =
                    new Date();

                until.setMonth(
                    until.getMonth() +
                    session.selectedMonths!,
                );

                await this.prisma.user.update({
                    where: {
                        id: user.id,
                    },
                    data: {
                        isPremium: true,
                        premiumUntil: until,
                    },
                });

                try {
                    await this.bot.telegram.sendMessage(
                        telegramId,
                        `
🎉 Premium muvaffaqiyatli aktivlashtirildi.

📅 Tugash sanasi:

${until.toLocaleDateString()}
      `,
                    );

                } catch (e) {
                    console.error(e);
                }

                await ctx.reply(
                    "✅ Premium berildi."
                );
                sessions.delete(
                    telegramId,
                );
            },
        );

        this.bot.action(
            /^reply_(\d+)$/,
            async (ctx) => {
                const userTelegramId =
                    Number(ctx.match[1]);

                this.adminReplyMap.set(
                    ctx.from.id,
                    userTelegramId,
                );

                await ctx.reply(
                    `
✍️ Userga yuboriladigan javobni yozing.
            `,
                );
            },
        );
    }
}