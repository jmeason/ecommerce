const router = require('express').Router();
const { Tag, Product, ProductTag } = require('../../models');

// The `/api/tags` endpoint

router.get('/', async (req, res) => {
  // find all tags
  try {
    const tagData = await Tag.findAll(
      {
        include: [{ model: Product }]
      });
    return res.json(tagData);
  }
  catch (err) {
    res.status(500).json(err)
  }
  // be sure to include its associated Product data
});

router.get('/:id', async (req, res) => {
  // find a single tag by its `id`
  try {
    const tagData= await Tag.findByPk(req.params.id,{
      include: [{model: Product}]
    })
    return res.json(tagData);
  }
  catch(err){
    res.status(500).json(err)
  }
  // be sure to include its associated Product data
});

router.post('/', (req, res) => {
  // create a new tag
  Tag.create(req.body)
  .then((tag) => {
    // if there's tag tags, we need to create pairings to bulk create in the TagTag model
    if (req.body.tagIds?.length) {
      const tagTagIdArr = req.body.tagIds.map((tag_id) => {
        return {
          tag_id: tag.id,
          tag_id,
        };
      });
      return TagTag.bulkCreate(tagTagIdArr);
    }
    // if no tag tags, just respond
    res.status(200).json(tag);
  })
  .then((tagTagIds) => res.status(200).json(tagTagIds))
  .catch((err) => {
    console.log(err);
    res.status(400).json(err);
  });
});

router.put('/:id', (req, res) => {
  // update a tag's name by its `id` value
  Tag.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((tag) => {
      if (req.body.tagIds && req.body.tagIds.length) {

        TagTag.findAll({
          where: { tag_id: req.params.id }
        }).then((tagTags) => {
          // create filtered list of new tag_ids
          const tagTagIds = tagTags.map(({ tag_id }) => tag_id);
          const newTagTags = req.body.tagIds
            .filter((tag_id) => !tagTagIds.includes(tag_id))
            .map((tag_id) => {
              return {
                tag_id: req.params.id,
                tag_id,
              };
            });

          // figure out which ones to remove
          const tagTagsToRemove = tagTags
            .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
            .map(({ id }) => id);
          // run both actions
          return Promise.all([
            TagTag.destroy({ where: { id: tagTagsToRemove } }),
            TagTag.bulkCreate(newTagTags),
          ]);
        });
      }

      return res.json(tag);
    })
    .catch((err) => {
      // console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/:id', async (req, res) => {
  try {
    const tagData = await Tag.destroy(
      {
        where: {
          id: req.params.id
        }
        })
      res.json(tagData);
    }
    catch(err){
      res.status(500).json(err)
    }
  // delete on tag by its `id` value
});

module.exports = router;
