const router = require('express').Router();
const { Category, Product } = require('../../models');

// The `/api/categories` endpoint

router.get('/', async (req, res) => {
  try {
    const categoryData = await Category.findAll(
      {
        include: [{ model: Product }]
      });
    return res.json(categoryData);
  }
  catch (err) {
    res.status(500).json(err)
  }
  // find all categories
  // be sure to include its associated Products
});


router.get('/:id', async (req, res) => {
  try {
    const categoryData= await Category.findByPk(req.params.id,{
      include: [{model: Product}]
    })
    return res.json(categoryData);
  }
  catch(err){
    res.status(500).json(err)
  }
  // find one category by its `id` value
  // be sure to include its associated Products
});

router.post('/', (req, res) => {
  // create a new category
  Category.create(req.body)
    .then((category) => {
      // if there's category tags, we need to create pairings to bulk create in the CategoryTag model
      if (req.body.tagIds?.length) {
        const categoryTagIdArr = req.body.tagIds.map((tag_id) => {
          return {
            category_id: category.id,
            tag_id,
          };
        });
        return CategoryTag.bulkCreate(categoryTagIdArr);
      }
      // if no category tags, just respond
      res.status(200).json(category);
    })
    .then((categoryTagIds) => res.status(200).json(categoryTagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

router.put('/:id', (req, res) => {
  // update a category by its `id` value
  Category.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((category) => {
      if (req.body.tagIds && req.body.tagIds.length) {

        CategoryTag.findAll({
          where: { category_id: req.params.id }
        }).then((categoryTags) => {
          // create filtered list of new tag_ids
          const categoryTagIds = categoryTags.map(({ tag_id }) => tag_id);
          const newCategoryTags = req.body.tagIds
            .filter((tag_id) => !categoryTagIds.includes(tag_id))
            .map((tag_id) => {
              return {
                category_id: req.params.id,
                tag_id,
              };
            });

          // figure out which ones to remove
          const categoryTagsToRemove = categoryTags
            .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
            .map(({ id }) => id);
          // run both actions
          return Promise.all([
            CategoryTag.destroy({ where: { id: categoryTagsToRemove } }),
            CategoryTag.bulkCreate(newCategoryTags),
          ]);
        });
      }

      return res.json(category);
    })
    .catch((err) => {
      // console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/:id', async (req, res) => {
  // delete a category by its `id` value
  try {
    const categoryData = await Category.destroy(
      {
        where: {
          id: req.params.id
        }
        })
      res.json(categoryData);
    }
    catch(err){
      res.status(500).json(err)
    }
});

module.exports = router;
