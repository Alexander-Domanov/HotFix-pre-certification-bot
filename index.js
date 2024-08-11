require('dotenv').config()

const {Bot, Keyboard, InlineKeyboard, GrammyError, HttpError} = require('grammy')

const bot = new Bot(process.env.BOT_API_KEY)
const {getRandomQuestion, getCorrectAnswer} = require('./utils')

bot.command('start', async (ctx) => {
    const startKeyboard = new Keyboard()
        .text('☕️ Классика')
        .text('🧊 Айс-Классика')
        .text('🌰 Альтернатива')
        .text('🥤 Айс-Альтернатива')
        .row()
        .text('🍋 Лимонады')
        .text('🍊 Бамбл/Тоники')
        .text('📚 Авторские/Чаи/18+/Фреш')
        .row()
        .text('🎲 Случайный вопрос')
        .resized();
    await ctx.reply(
        'Привет! Я - HOTFIX Бот Для Предварительной Сертификации 🤖 \nЯ помогу вам подготовиться к ней',
    );
    await ctx.reply('С чего начнем? Выбери тему вопроса в меню 👇', {
        reply_markup: startKeyboard,
    });
});

bot.hears(
    ['☕️ Классика', '🧊 Айс-Классика', '🌰 Альтернатива', '🥤 Айс-Альтернатива','🍋 Лимонады','🍊 Бамбл/Тоники', '📚 Авторские/Чаи/18+/Фреш', '🎲 Случайный вопрос'],
    async (ctx) => {

        const topicLowerCase = ctx.message.text
            .replace(/[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{1F700}-\u{1F77F}|\u{1F780}-\u{1F7FF}|\u{1F800}-\u{1F8FF}|\u{1F900}-\u{1F9FF}|\u{1FA00}-\u{1FA6F}|\u{1FA70}-\u{1FAFF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}|\u{FE0F}]/gu, '')
            .replace(/^\s+/, '')
            .toLowerCase();

        const allTopic = {
            'классика': 'classic',
            'айс-классика': 'ice_classic',
            'альтернатива': 'alternative',
            'айс-альтернатива': 'ice_alt',
            'лимонады': 'lemonades',
            'бамбл/тоники': 'tonic_bambl',
            'авторские/чаи/алкоголь/фреш': 'mix_drinks',
            'случайный вопрос': 'случайный вопрос'
        }
        const topic = allTopic[topicLowerCase]

        const {question, questionTopic} = getRandomQuestion(topic);

        let inlineKeyboard;
        if (question.hasOptions) {
            const buttonRows = question.options.map((option) => {
                    return [
                        InlineKeyboard.text(
                            option.text,
                            JSON.stringify({
                                type: `${questionTopic}-option`,
                                isCorrect: option.isCorrect,
                                questionId: question.id,
                            }),
                        ),
                    ]
                }
            );
            inlineKeyboard = InlineKeyboard.from(buttonRows);
        } else {
            inlineKeyboard = new InlineKeyboard().text(
                'Узнать ответ',
                JSON.stringify({
                    type: questionTopic,
                    questionId: question.id,
                }),
            );
        }
        await ctx.reply(question.text, {
            reply_markup: inlineKeyboard,
        });
    },
);

bot.on('callback_query:data', async (ctx) => {
    const callbackData = JSON.parse(ctx.callbackQuery.data);

    if (!callbackData.type.includes('option')) {
        const answer = getCorrectAnswer(callbackData.type, callbackData.questionId);
        await ctx.reply(answer, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
        });
        await ctx.answerCallbackQuery();
        return;
    }

    if (callbackData.isCorrect) {
        await ctx.reply('Верно ✅');
        await ctx.answerCallbackQuery();
        return;
    }

    const answer = getCorrectAnswer(
        callbackData.type.split('-')[0],
        callbackData.questionId,
    );
    await ctx.reply(`Неверно ❌ Правильный ответ: ${answer}`);
    await ctx.answerCallbackQuery();
});

bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
        console.error('Error in request:', e.description);
    } else if (e instanceof HttpError) {
        console.error('Could not contact Telegram:', e);
    } else {
        console.error('Unknown error:', e);
    }
});

bot.start();