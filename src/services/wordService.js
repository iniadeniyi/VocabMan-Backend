require("dotenv").config();

const axios = require("axios");
const path = require("path");
const fs = require("fs");

const { format, addDays } = require("date-fns");
const { db } = require("../config/firebaseAdminSetup");

const wordsFilePath = path.join(__dirname, "..", "data", "words.json");

function getRandomWord() {
    try {
        const dataString = fs.readFileSync(wordsFilePath, "utf-8");
        const data = JSON.parse(dataString);
        const words = data.words;
        const randomWord = words[Math.floor(Math.random() * words.length)];
        return randomWord.word;
    } catch (error) {
        console.error("Error reading file or selecting a random word:", error);
    }
}

async function getWordDetails(word) {
    const headers = {
        "X-RapidAPI-Key": process.env.WORDS_API_KEY,
        "X-RapidAPI-Host": "wordsapiv1.p.rapidapi.com",
    };

    try {
        const [definitionsRes, antonymsRes, synonymsRes, examplesRes] =
            await Promise.all([
                axios.get(
                    `https://wordsapiv1.p.rapidapi.com/words/${word}/definitions`,
                    { headers }
                ),
                axios.get(
                    `https://wordsapiv1.p.rapidapi.com/words/${word}/antonyms`,
                    { headers }
                ),
                axios.get(
                    `https://wordsapiv1.p.rapidapi.com/words/${word}/synonyms`,
                    { headers }
                ),
                axios.get(
                    `https://wordsapiv1.p.rapidapi.com/words/${word}/examples`,
                    { headers }
                ),
            ]);

        return {
            definitions: definitionsRes.data.definitions,
            antonyms: antonymsRes.data.antonyms,
            synonyms: synonymsRes.data.synonyms,
            examples: examplesRes.data.examples,
        };
    } catch (error) {
        console.error("Error fetching word details:", error);
        return {};
    }
}

function structureObject(word, details) {
    wordOfTheDay = {
        word: word,
        definition: details.definitions[0],
        synonyms: details.synonyms,
        antonyms: details.antonyms,
        examples: details.examples,
    };
    return wordOfTheDay;
}

async function generateWord() {
    const randomWord = getRandomWord();
    const wordDetails = await getWordDetails(randomWord);
    return structureObject(randomWord, wordDetails);
}

async function initializeWordsBuffer() {
    const today = new Date();
    for (let i = 0; i <= 3; i++) {
        const date = addDays(today, i);
        const formattedDate = format(date, "yyyy-MM-dd");
        try {
            const word = await generateWord();
            await db.collection("words").doc(formattedDate).set(word);
            console.log(`Word for ${formattedDate} added successfully.`);
        } catch (error) {
            console.error(`Error adding word for ${formattedDate}:`, error);
        }
    }
}

async function updateWordsBuffer() {
    const threeDaysFromNow = addDays(new Date(), 3);
    const formattedDate = format(threeDaysFromNow, "yyyy-MM-dd");
    try {
        const word = await generateWord();
        await db.collection("words").doc(formattedDate).set(word);
        console.log(`Word for ${formattedDate} added successfully.`);
    } catch (error) {
        console.error(`Error adding word for ${formattedDate}:`, error);
    }
}
