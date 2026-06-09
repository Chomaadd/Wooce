---
name: Coin system ObjectId casting
description: All MongoDB queries for ChapterPremiumModel/UnlockedChapterModel require explicit ObjectId casting — string comparison silently fails.
---

## Rule
Always use `new mongoose.Types.ObjectId(id)` explicitly when querying ChapterPremiumModel, UnlockedChapterModel, or CoinTransactionModel. Never pass raw string IDs.

**Why:** Mongoose schema fields typed as `ObjectId` don't always auto-cast strings in findOne() queries in some Mongoose 7.x edge cases, causing silent query mismatches where premium chapters appear free.

**How to apply:**
- Read route: `ChapterPremiumModel.findOne({ chapterId: new mongoose.Types.ObjectId(chapter.id) })`
- Unlock route: both `userId` and `chapterId` must be cast
- PATCH premium: use `$set` operator (not replacement doc) + explicit ObjectId:
  `findOneAndUpdate({ chapterId: objId }, { $set: { storyId, coinPrice } }, { upsert: true })`
- Also: admins (session has `adminId`, NOT `userId`) must be bypassed before the premium check, otherwise admins see locked chapters.
