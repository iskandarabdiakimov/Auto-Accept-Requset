const { Telegraf, Markup } = require("telegraf");
const { User, Group, Log } = require("./models");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  if (ctx.chat.type === "private") {
    const messageText =
      "🤖 Auto Accept Request Botga xush kelibsiz!\n\n" +
      "Botni guruh yoki kanalingizga admin sifatida qo'shing, " +
      "u a'zolik so'rovlarini avtomatik qabul qiladi.";

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.url(
          "➕ Guruhga qo'shish",
          `https://t.me/${ctx.botInfo.username}?startgroup=true&admin=post_messages+edit_messages+delete_messages+restrict_members+invite_users+promote_members`
        ),
        Markup.button.url(
          "📢 Kanalga qo'shish",
          `https://t.me/${ctx.botInfo.username}?startchannel=true&admin=post_messages+edit_messages+delete_messages+invite_users`
        ),
      ],
      [Markup.button.callback("ℹ️ Yordam", "help")],
    ]);

    ctx.reply(messageText, keyboard);
  }
});

bot.on("chat_join_request", async (ctx) => {
  if (ctx.chat.type === "private") return;

  try {
    if (!ctx.chatJoinRequest?.from?.id || !ctx.chat?.id) {
      console.log("Invalid request parameters");
      return;
    }

    const userId = Number(ctx.chatJoinRequest.from.id);
    const chatId = Number(ctx.chat.id);

    await ctx.telegram.approveChatJoinRequest(chatId, userId);
    console.log(`✅ Success: User ${userId} added to chat ${chatId}`);
  } catch (error) {
    console.error("Error during join request approval:", error.message);
  }
});

bot.on("new_chat_members", async (ctx) => {
  try {
    if (
      ctx.message.new_chat_members.some(
        (member) => member.id === ctx.botInfo.id
      )
    ) {
      const chat = ctx.chat;
      const addedByUser = ctx.from;
      const admins = await ctx.getChatAdministrators();

      const group = await Group.findOneAndUpdate(
        {
          chatId: chat.id,
        },
        {
          title: chat.title,
          type: chat.type,
          admins: admins.map((admin) => ({
            userId: admin.user.id,
            firstName: admin.user.first_name,
            lastName: admin.user.last_name || "",
            username: admin.user.username || "",
            isBot: admin.user.is_bot,
          })),
          addedBy: await User.findOne({
            userId: addedByUser.id,
          }),
          lastActivity: new Date(),
        },
        {
          upsert: true,
          new: true,
        }
      );

      for (const admin of admins) {
        if (!admin.user.is_bot) {
          await ctx.telegram
            .sendMessage(
              admin.user.id,
              `✅ Bot "${chat.title}" guruhiga muvaffaqiyatli qo'shildi!\n\n` +
                `Qo'shgan admin: ${addedByUser.first_name} (@${
                  addedByUser.username || "noma'lum"
                })\n` +
                `Adminlar soni: ${admins.length}\n\n` +
                `Endi bot guruhga kelgan barcha so'rovlarni avtomatik tasdiqlaydi.`
            )
            .catch((e) => console.log("Admin xabarida xato:", e.message));
        }
      }

      await new Log({
        action: "bot_added_to_group",
        userId: addedByUser.id,
        chatId: chat.id,
        details: {
          chatTitle: chat.title,
          adminsCount: admins.length,
          addedBy: `${addedByUser.first_name} (@${
            addedByUser.username || "noma'lum"
          })`,
        },
      }).save();
      return;
    }

    for (const member of ctx.message.new_chat_members) {
      if (!member.is_bot) {
        await User.findOneAndUpdate(
          {
            userId: member.id,
          },
          {
            firstName: member.first_name,
            lastName: member.last_name || "",
            username: member.username || "",
          },
          {
            upsert: true,
          }
        );

        await ctx.telegram
          .sendMessage(
            member.id,
            `🎉 "${ctx.chat.title}" guruhiga qo'shilganingiz bilan tabriklaymiz!\n\n` +
              `Guruhga qo'shgan admin: ${ctx.from.first_name} (@${
                ctx.from.username || "noma'lum"
              })\n` +
              `Guruhda faol ishtirok etishingizni umid qilamiz!`
          )
          .catch((e) => console.log("Xabar yuborishda xato:", e.message));

        await new Log({
          action: "user_joined",
          userId: member.id,
          chatId: ctx.chat.id,
          details: {
            addedBy: `${ctx.from.first_name} (@${
              ctx.from.username || "noma'lum"
            })`,
            chatTitle: ctx.chat.title,
          },
        }).save();
      }
    }
  } catch (error) {
    console.error("new_chat_members handler error:", error);
  }
});

module.exports = bot;
