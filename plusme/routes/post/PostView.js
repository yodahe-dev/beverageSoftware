const express = require('express');
const router = express.Router();
const { Op, fn, col, literal, Sequelize } = require('sequelize');
const { Post, User, Like, Follow, SavedPost, Comment, Tag, Chat } = require('../models');












// const MIN_SIMILARITY = 0.25;
// const MAX_RESULTS = 30;

// // Helper: get user context text for recommendation
// async function getUserContextText(userId) {
//   const chats = await Chat.findAll({
//     where: { [Op.or]: [{ senderId: userId }, { receiverId: userId }] },
//     order: [['createdAt', 'DESC']],
//     limit: 50,
//   });

//   const chatText = chats.map(c => {
//     if (typeof c.content === 'string') return c.content;
//     if (typeof c.content === 'object') return JSON.stringify(c.content);
//     return '';
//   }).join(' ').toLowerCase();

//   const likedPosts = await Post.findAll({
//     include: [{ model: Like, where: { userId }, attributes: [] }, { model: Tag, as: 'tags', attributes: ['name'], through: { attributes: [] } }],
//     attributes: ['title', 'description'],
//     limit: 30,
//   });

//   const likedText = likedPosts.map(p => {
//     const tagText = p.tags.map(t => t.name).join(' ');
//     return (p.title + ' ' + (p.description || '') + ' ' + tagText).toLowerCase();
//   }).join(' ');

//   const savedPosts = await Post.findAll({
//     include: [{ model: SavedPost, where: { userId }, attributes: [] }, { model: Tag, as: 'tags', attributes: ['name'], through: { attributes: [] } }],
//     attributes: ['title', 'description'],
//     limit: 30,
//   });

//   const savedText = savedPosts.map(p => {
//     const tagText = p.tags.map(t => t.name).join(' ');
//     return (p.title + ' ' + (p.description || '') + ' ' + tagText).toLowerCase();
//   }).join(' ');

//   const comments = await Comment.findAll({
//     where: { userId },
//     include: [{ model: Post, include: [{ model: Tag, as: 'tags', attributes: ['name'], through: { attributes: [] } }] }],
//     limit: 50,
//   });

//   const commentText = comments.map(c => {
//     const post = c.Post;
//     const postTagText = post.tags.map(t => t.name).join(' ');
//     return (c.content + ' ' + post.title + ' ' + (post.description || '') + ' ' + postTagText).toLowerCase();
//   }).join(' ');

//   const user = await User.findByPk(userId);
//   const userBio = user?.bio?.toLowerCase() || '';

//   return (chatText + ' ' + likedText + ' ' + savedText + ' ' + commentText + ' ' + userBio).trim();
// }

// async function recommendPosts(userId, res) {
//   const userContext = await getUserContextText(userId);

//   if (!userContext) return fallbackTrending(res);

//   const relevantTags = await Tag.findAll({
//     where: Sequelize.where(fn('similarity', col('name'), userContext), '>', MIN_SIMILARITY),
//     order: [[literal(`similarity("name", '${userContext}')`), 'DESC']],
//     limit: 5,
//   });

//   const tagIds = relevantTags.map(t => t.id);

//   const posts = await Post.findAll({
//     include: [
//       { model: User, as: 'author', attributes: ['id', 'username', 'name', 'profileImage', 'bio'] },
//       { model: Tag, as: 'tags', attributes: ['id', 'name'], through: { attributes: [] }, where: tagIds.length ? { id: { [Op.in]: tagIds } } : undefined, required: tagIds.length > 0 },
//       { model: Comment, attributes: ['content'], required: false }
//     ],
//     limit: MAX_RESULTS * 3,
//   });

//   const postIds = posts.map(p => p.id);

//   const likes = await Like.findAll({ where: { postId: { [Op.in]: postIds } }, attributes: ['postId', [fn('COUNT', col('id')), 'count']], group: ['postId'] });
//   const commentsCount = await Comment.findAll({ where: { postId: { [Op.in]: postIds } }, attributes: ['postId', [fn('COUNT', col('id')), 'count']], group: ['postId'] });
//   const saves = await SavedPost.findAll({ where: { postId: { [Op.in]: postIds } }, attributes: ['postId', [fn('COUNT', col('id')), 'count']], group: ['postId'] });

//   const likesCountMap = {};
//   likes.forEach(l => { likesCountMap[l.postId] = parseInt(l.get('count'), 10); });

//   const commentsCountMap = {};
//   commentsCount.forEach(c => { commentsCountMap[c.postId] = parseInt(c.get('count'), 10); });

//   const savesCountMap = {};
//   saves.forEach(s => { savesCountMap[s.postId] = parseInt(s.get('count'), 10); });

//   const scoredPosts = posts.map(post => {
//     const tagMatchCount = post.tags?.length || 0;
//     const contentText = JSON.stringify(post.contentJson || {}).toLowerCase();
//     const similarityContent = contentText.includes(userContext) ? 1 : 0;
//     const likeCount = likesCountMap[post.id] || 0;
//     const commentCount = commentsCountMap[post.id] || 0;
//     const saveCount = savesCountMap[post.id] || 0;
//     const randomFactor = Math.random();

//     const score = tagMatchCount * 3 + likeCount * 0.5 + commentCount * 0.3 + saveCount * 0.7 + similarityContent * 5 + randomFactor * 2;

//     return { post, score };
//   });

//   scoredPosts.sort((a, b) => b.score - a.score);

//   const resultPosts = scoredPosts.slice(0, MAX_RESULTS).map(p => p.post);

//   if (resultPosts.length === 0) return fallbackTrending(res);

//   return res.json(resultPosts);
// }

// async function fallbackTrending(res) {
//   const oneWeekAgo = new Date();
//   oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

//   const posts = await Post.findAll({
//     include: [
//       { model: Like, attributes: [] },
//       { model: User, as: 'author', attributes: ['id', 'username', 'name', 'profileImage'] },
//     ],
//     where: { createdAt: { [Op.gte]: oneWeekAgo } },
//     attributes: { include: [[fn('COUNT', col('Likes.id')), 'likeCount']] },
//     group: ['Post.id', 'author.id'],
//     order: [[literal('likeCount'), 'DESC']],
//     limit: MAX_RESULTS,
//   });

//   return res.json(posts);
// }

// async function searchPosts(query, res) {
//   if (!query) return res.status(400).json({ message: 'query required for search' });

//   const posts = await Post.findAll({
//     include: [
//       {
//         model: User,
//         as: 'author',
//         attributes: ['id', 'username', 'name', 'profileImage'],
//         where: {
//           [Op.or]: [
//             Sequelize.where(fn('similarity', col('username'), query), '>', MIN_SIMILARITY),
//             Sequelize.where(fn('similarity', col('name'), query), '>', MIN_SIMILARITY),
//           ],
//         },
//         required: false,
//       }
//     ],
//     limit: 50,
//     order: [['createdAt', 'DESC']],
//   });

//   return res.json(posts);
// }

// async function trendingPosts(res) {
//   const oneWeekAgo = new Date();
//   oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

//   const posts = await Post.findAll({
//     include: [
//       { model: Like, attributes: [] },
//       { model: User, as: 'author', attributes: ['id', 'username', 'name', 'profileImage'] },
//     ],
//     where: { createdAt: { [Op.gte]: oneWeekAgo } },
//     attributes: { include: [[fn('COUNT', col('Likes.id')), 'likeCount']] },
//     group: ['Post.id', 'author.id'],
//     order: [[literal('likeCount'), 'DESC']],
//     limit: MAX_RESULTS,
//   });

//   return res.json(posts);
// }

// async function viralPosts(res) {
//   const posts = await Post.findAll({
//     include: [
//       { model: Like, attributes: [] },
//       { model: Comment, attributes: [] },
//       { model: User, as: 'author', attributes: ['id', 'username', 'name', 'profileImage'] },
//     ],
//     attributes: {
//       include: [
//         [fn('COUNT', col('Likes.id')), 'likeCount'],
//         [fn('COUNT', col('Comments.id')), 'commentCount'],
//       ],
//     },
//     group: ['Post.id', 'author.id'],
//     order: [[literal('(COUNT("Likes"."id") + COUNT("Comments"."id"))'), 'DESC']],
//     limit: MAX_RESULTS,
//   });

//   return res.json(posts);
// }

// async function topFollowersPosts(res) {
//   const posts = await Post.findAll({
//     include: [
//       {
//         model: User,
//         as: 'author',
//         attributes: ['id', 'username', 'name', 'profileImage'],
//         include: [{ model: Follow, as: 'Followers', attributes: [] }],
//       },
//     ],
//     attributes: { include: [[fn('COUNT', col('author.Followers.id')), 'followerCount']] },
//     group: ['Post.id', 'author.id'],
//     order: [[literal('followerCount'), 'DESC']],
//     limit: MAX_RESULTS,
//   });

//   return res.json(posts);
// }

// async function randomPosts(res) {
//   const posts = await Post.findAll({
//     include: [{ model: User, as: 'author', attributes: ['id', 'username', 'name', 'profileImage'] }],
//     order: [Sequelize.literal('RANDOM()')],
//     limit: MAX_RESULTS,
//   });

//   return res.json(posts);
// }

// router.get('/posts', async (req, res) => {
//   const { mode = 'random', query, userId } = req.query;
//   try {
//     switch (mode) {
//       case 'search': return await searchPosts(query, res);
//       case 'trending': return await trendingPosts(res);
//       case 'viral': return await viralPosts(res);
//       case 'topFollowers': return await topFollowersPosts(res);
//       case 'recommend':
//         if (!userId) return res.status(400).json({ message: 'userId required for recommendation' });
//         return await recommendPosts(userId, res);
//       case 'random':
//       default: return await randomPosts(res);
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Failed to fetch posts' });
//   }
// });

// module.exports = router;
