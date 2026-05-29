import { readdir, readFile } from "fs/promises";
import path from "path";
import { loadConfig } from "../config";
import matter from "gray-matter";
import { getUnitAndValueFormat } from "../lib/time-ago";

export interface PostFile {
  fileName: string;
  title: string;
  date: string;
  draft: boolean;
}

export interface PostWithContent extends PostFile {
  content: string;
  filePath: string;
}

const parsePostsDirectory = async (
  postsDirectory: string,
): Promise<PostFile[]> => {
  const fileList = await readdir(postsDirectory);
  const postsData: PostFile[] = [];

  for (const fileName of fileList) {
    const filePath = path.join(postsDirectory, fileName);
    const fileContents = await readFile(filePath);
    const postData = await parsePostFile(fileName, fileContents);
    postsData.push(postData);
  }
  return postsData;
};

async function parsePostFile(
  fileName: string,
  fileContents: Buffer,
): Promise<PostFile> {
  const parsedMatter = matter(fileContents);
  return {
    fileName,
    title: parsedMatter.data.title,
    date: parsedMatter.data.date,
    draft: parsedMatter.data.draft,
  };
}

export async function getPosts(
  includeDrafts: boolean = false,
): Promise<PostFile[]> {
  const config = await loadConfig();
  const postsDirectory = `${config.path}/build/posts/`;
  let files = await parsePostsDirectory(postsDirectory);
  if (!includeDrafts) {
    files = files.filter((f) => f.draft == false);
  }
  files = files.sort((a, b) => {
    return new Date(a.date) >= new Date(b.date) ? -1 : 1;
  });
  return files;
}

export async function getPostByIndex(
  index: number,
  includeDrafts: boolean = false,
): Promise<PostWithContent | null> {
  const posts = await getPosts(includeDrafts);
  if (index < 0 || index >= posts.length) {
    return null;
  }

  const post = posts[index];
  const config = await loadConfig();
  const postsDirectory = `${config.path}/build/posts/`;
  const filePath = path.join(postsDirectory, post.fileName);

  try {
    const content = await readFile(filePath, "utf-8");
    return {
      ...post,
      content,
      filePath,
    };
  } catch (error) {
    return null;
  }
}

function formatTimeAgo(date: string): string {
  const now = new Date();
  const relativeTimeFormat = new Intl.RelativeTimeFormat("en", {
    style: "long",
    numeric: "auto",
  });
  const elapsedTime = now.getTime() - new Date(date).getTime();
  const [value, unit] = getUnitAndValueFormat(elapsedTime);

  return relativeTimeFormat.format(
    Math.floor((new Date(date).getTime() - now.getTime()) / value),
    unit,
  );
}

export async function listPosts(includeDrafts: boolean = false) {
  const files = await getPosts(includeDrafts);

  files.forEach((file) => {
    const { title, date, draft } = file;
    const columnSize = 60;
    const timeAgo = formatTimeAgo(date);
    const postString = `${draft ? "\x1b[31m" : "\x1b[37m"}${title.padEnd(columnSize)}${timeAgo.padStart(16)}`;
    console.log(postString);
  });
  // reset color
  console.log("\x1b[0m");
}
