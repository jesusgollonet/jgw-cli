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

const parsePostsDirectory = async (
  postsDirectory: string,
): Promise<PostFile[]> => {
  const fileList = await readdir(postsDirectory);
  const postsData = [];
  for await (let fileName of fileList) {
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

export async function listPosts(includeDrafts: boolean = false) {
  const config = await loadConfig();
  const postsDirectory = `${config.path}/build/posts/`;
  let files = await parsePostsDirectory(postsDirectory);
  if (!includeDrafts) {
    console.log("no drafts");
    files = files.filter((f) => f.draft == false);
  }
  files = files.sort((a, b) => {
    return new Date(a.date) >= new Date(b.date) ? -1 : 1;
  });

  const now = new Date();
  files.forEach(async (file) => {
    const { title, date } = file;
    const columnSize = 60;
    const relativeTimeFormat = new Intl.RelativeTimeFormat("en", {
      style: "long",
      numeric: "auto",
    });
    const ellapsedTime = now.getTime() - new Date(date).getTime();
    const [value, unit] = getUnitAndValueFormat(ellapsedTime);
    console.log(
      title.padEnd(columnSize, " "),
      relativeTimeFormat.format(
        Math.floor((new Date(date).getTime() - now.getTime()) / value),
        unit,
      ),
    );
  });
}
