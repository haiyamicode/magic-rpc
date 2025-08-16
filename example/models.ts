// Example domain models
export interface User {
  id: string;
  name: string;
  email: string;
  avatarId?: string;
  followedUserIds: string[];
}

export interface Post {
  id: string;
  userId: string;
  title: string;
  content: string;
  imageId?: string;
  likedByUserIds: string[];
  createdAt: Date;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: Date;
}

export interface Asset {
  id: string;
  url: string;
  type: 'image' | 'avatar';
  userId: string;
}

// Mock database
export const db = {
  users: new Map<string, User>([
    ['user1', { id: 'user1', name: 'Alice', email: 'alice@example.com', avatarId: 'avatar1', followedUserIds: ['user2'] }],
    ['user2', { id: 'user2', name: 'Bob', email: 'bob@example.com', avatarId: 'avatar2', followedUserIds: ['user1'] }],
    ['user3', { id: 'user3', name: 'Charlie', email: 'charlie@example.com', followedUserIds: [] }],
  ]),
  
  posts: new Map<string, Post>([
    ['post1', { 
      id: 'post1', 
      userId: 'user1', 
      title: 'First Post', 
      content: 'Hello World!', 
      imageId: 'image1',
      likedByUserIds: ['user2', 'user3'],
      createdAt: new Date('2024-01-01') 
    }],
    ['post2', { 
      id: 'post2', 
      userId: 'user2', 
      title: 'Second Post', 
      content: 'GraphQL-like resolvers are cool!',
      likedByUserIds: ['user1'],
      createdAt: new Date('2024-01-02') 
    }],
  ]),
  
  comments: new Map<string, Comment>([
    ['comment1', { id: 'comment1', postId: 'post1', userId: 'user2', content: 'Great post!', createdAt: new Date('2024-01-01') }],
    ['comment2', { id: 'comment2', postId: 'post1', userId: 'user3', content: 'Thanks for sharing!', createdAt: new Date('2024-01-02') }],
  ]),
  
  assets: new Map<string, Asset>([
    ['avatar1', { id: 'avatar1', url: 'https://example.com/avatar1.jpg', type: 'avatar', userId: 'user1' }],
    ['avatar2', { id: 'avatar2', url: 'https://example.com/avatar2.jpg', type: 'avatar', userId: 'user2' }],
    ['image1', { id: 'image1', url: 'https://example.com/image1.jpg', type: 'image', userId: 'user1' }],
  ]),
};