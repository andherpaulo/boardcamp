import GamesRepository from "../repositories/gamesRepository.js";

const { getAllGames, postNewCategory, getGameByNameCaseInsensitive } =
    GamesRepository;

export async function getGames(req, res) {
    const { name } = req.query;

    try {
        if (name !== undefined) {
            const filteredGames = await getGameByNameCaseInsensitive(name);

            return res.send(filteredGames);
        }

        const games = await getAllGames();

        if (games.length === 0)
            return res.status(404).send({ message: "Nenhum jogo cadastrado!" });

        res.send(games);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}

export async function postGame(req, res) {
    const { newCategory } = res.locals;

    try {
        await postNewCategory(newCategory);
        res.sendStatus(201);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}
