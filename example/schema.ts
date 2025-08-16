import * as h from "@haiyami/hyperstruct";

// Define schemas for our domain models
export const UserSchema = h.defineType('User', h.object({
  id: h.string(),
  name: h.string(),
  email: h.string(),
  avatarId: h.string(),
  followedUserIds: h.array(h.string()),
}));
// defineType automatically adds the name property

export const PostSchema = h.defineType('Post', h.object({
  id: h.string(),
  userId: h.string(),
  title: h.string(),
  content: h.string(),
  imageId: h.string(),
  likedByUserIds: h.array(h.string()),
  createdAt: h.date(),
}));

export const CommentSchema = h.defineType('Comment', h.object({
  id: h.string(),
  postId: h.string(),
  userId: h.string(),
  content: h.string(),
  createdAt: h.date(),
}));

export const AssetSchema = h.defineType('Asset', h.object({
  id: h.string(),
  url: h.string(),
  type: h.string(),
  userId: h.string(),
}));

// Input/Output schemas for RPC methods
export const GetUserInputSchema = h.object({
  userId: h.string(),
});

export const GetUserOutputSchema = UserSchema;

export const GetPostsInputSchema = h.object({
  userId: h.string(),
  limit: h.string(),
});

export const GetPostsOutputSchema = h.object({
  posts: h.array(PostSchema),
  hasMore: h.boolean(),
});

export const GetFeedInputSchema = h.object({
  userId: h.string(),
  limit: h.string(),
});

export const GetFeedOutputSchema = h.object({
  posts: h.array(PostSchema),
  totalCount: h.string(),
});

// Type exports
export type User = h.Infer<typeof UserSchema>;
export type Post = h.Infer<typeof PostSchema>;
export type Comment = h.Infer<typeof CommentSchema>;
export type Asset = h.Infer<typeof AssetSchema>;
