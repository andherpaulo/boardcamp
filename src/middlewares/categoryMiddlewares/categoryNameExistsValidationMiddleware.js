import CategoriesRepository from "../../repositories/categoriesRepository.js";

export default async function categoryNameExistsValidation(req, res, next) {
    const { name } = res.locals;

    try {
        const category = await CategoriesRepository.getCategoryByName(name);
        const categoryAlreadyExists = category.rowCount !== 0;

        if (categoryAlreadyExists)
            return res.status(409).send({
                message:
                    "Já existe uma categoria com esse nome, por favor insira outro!",
            });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }

    next();
}
