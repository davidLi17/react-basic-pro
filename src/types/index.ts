export interface User {
  uid: string;
  avatar: string;
  uname: string;
}

export interface CommentItem {
  rpid: string;
  user: User;
  content: string;
  ctime: string;
  like: number;
  isLiked?: boolean;
  images?: string[];
}

export interface UploadFile {
  file: File;
  preview: string;
}

export interface Tab {
  type: string;
  text: string;
}

export interface ConsoleOutput {
  type: string;
  content: string;
  timestamp: number;
}

export interface Task {
  type: string;
  content: string;
  output?: string | undefined;
}
