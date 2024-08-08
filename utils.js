const question = require('./question.json')

const getRandomQuestion = (topic) => {
    const questionTopic = topic.toLowerCase()
    const randomQuestionIndex = Math.floor(
        Math.random() * question[questionTopic].length
    )

    return question[questionTopic][randomQuestionIndex]
}