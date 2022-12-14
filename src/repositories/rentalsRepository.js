import connectionDB from "../database/db.js";
import GamesRepository from "./gamesRepository.js";
import { format, differenceInDays, startOfToday } from "date-fns";

const RentalsRepository = {
    postNewRental: async ({ customerId, gameId, daysRented }) => {
        const rentDate = format(new Date(), "yyyy-MM-dd");

        const rentedGame = await GamesRepository.getGameById(gameId);
        const originalPrice = daysRented * rentedGame.pricePerDay;

        await connectionDB.query(
            `INSERT INTO
                rentals
                ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee")
            VALUES
                ($1, $2, $3, $4, $5, $6, $7);`,
            [
                customerId,
                gameId,
                rentDate,
                daysRented,
                null,
                originalPrice,
                null,
            ]
        );
    },
    getAllRentalsByFilters: async (
        customerId,
        gameId,
        offset,
        limit,
        order,
        desc,
        startDate = "1900-01-01"
    ) => {
        let customerAndGameFilter = ``;
        let customerAndGameArr = [];

        if (customerId && gameId) {
            customerAndGameFilter = ` AND "customerId" = $4 AND "gameId" = $5 `;
            customerAndGameArr = [customerId, gameId];
        } else if (customerId) {
            customerAndGameFilter = ` AND "customerId" = $4 `;
            customerAndGameArr = [customerId];
        } else if (gameId) {
            customerAndGameFilter = ` AND "gameId" = $4 `;
            customerAndGameArr = [gameId];
        }

        const formattedOrder = `"${order}"`;
        const orderBy = [
            "id",
            "customerId",
            "gameId",
            "rentDate",
            "daysRented",
            "returnDate",
            "originalPrice",
            "delayFee",
        ].includes(order)
            ? `ORDER BY ${formattedOrder}`
            : "";

        const rentals = await connectionDB.query(
            `SELECT
                *
            FROM
                rentals
            WHERE
                "rentDate" >= $3
            ${customerAndGameFilter}
            ${orderBy}
            ${desc ? "DESC" : ""}
            LIMIT
                $1
            OFFSET
                $2;`,
            [limit, offset, startDate, ...customerAndGameArr]
        );
        return rentals.rows;
    },
    getRentalById: async (id) => {
        const rental = await connectionDB.query(
            `SELECT
                *
            FROM
                rentals
            WHERE
                id = $1;`,
            [id]
        );
        return rental.rows[0];
    },
    updateRentalReturnDate: async (id) => {
        await connectionDB.query(
            `UPDATE
                rentals
            SET
                "returnDate" = $1
            WHERE
                id=$2;`,
            [format(new Date(), "yyyy-MM-dd"), id]
        );
    },
    updateRentalDelayFee: async (id) => {
        const rental = await RentalsRepository.getRentalById(id);

        const daysActuallyRented = differenceInDays(
            startOfToday(),
            rental.rentDate
        );
        const daysOfDelay = daysActuallyRented - rental.daysRented;
        const pricePerDay = rental.originalPrice / rental.daysRented;
        const delayFee = daysOfDelay > 0 ? daysOfDelay * pricePerDay : 0;

        await connectionDB.query(
            `UPDATE
                rentals
            SET
                "delayFee" = $1
            WHERE
                id=$2;`,
            [delayFee, id]
        );
    },
    deleteSpecificRental: async (id) => {
        await connectionDB.query(
            `DELETE FROM rentals
            WHERE id=$1;`,
            [id]
        );
    },
    getTotalRevenue: async ({
        startDate = "1900-01-01",
        endDate = "2100-12-31",
    }) => {
        const originalRevenue = await connectionDB.query(
            `SELECT SUM ("originalPrice")
            FROM rentals
            WHERE "rentDate" >= $1 AND "rentDate" <= $2;`,
            [startDate, endDate]
        );
        const delayRevenue = await connectionDB.query(
            `SELECT SUM ("delayFee")
            FROM rentals
            WHERE "rentDate" >= $1 AND "rentDate" <= $2;`,
            [startDate, endDate]
        );
        return (
            Number(originalRevenue.rows[0].sum) +
            Number(delayRevenue.rows[0].sum)
        );
    },
    getRentalsAmount: async ({
        startDate = "1900-01-01",
        endDate = "2100-12-31",
        game,
        customer,
    }) => {
        const gameWhere = game ? `"gameId" = ${game}` : true;
        const customerWhere = customer ? `"customerId" = ${customer}` : true;

        const amount = await connectionDB.query(
            `SELECT COUNT(id)
            FROM rentals
            WHERE "rentDate" >= $1
            AND "rentDate" <= $2
            AND ${gameWhere}
            AND ${customerWhere};`,
            [startDate, endDate]
        );
        return Number(amount.rows[0].count);
    },
};

export default RentalsRepository;
