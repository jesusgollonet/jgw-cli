#!/usr/bin/env bun

import confirm from "@inquirer/confirm";
import { rm, writeFile } from "fs/promises";
import matter from "gray-matter";
import path from "path";
import { loadConfig } from "../config";
import { openExistingFileInEditor } from "../lib/editor";
import { openPostPreview } from "../lib/post-preview";

const postMetadata = (postName: string, postDate: string) => {
  return `---
title: '${postName}'
date: '${postDate}'
draft: true
---`;
};

const slugifyTitle = (title: string) =>
  title
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();

export const openEditor = async (postTitle?: string) => {
  const config = await loadConfig();
  const postsDirectory = path.join(
    config.path,
    config.postsDirectory ?? "build/posts",
  );

  const initialTitle = postTitle || "untitled";
  const initialDate = new Date().toISOString();
  const fileTitle = slugifyTitle(initialTitle);
  const fileDate = initialDate.split("T")[0];
  const postFilename = `${fileDate}_${fileTitle}.md`;
  const filePath = path.join(postsDirectory, postFilename);
  await writeFile(filePath, postMetadata(initialTitle, initialDate), "utf8");
  console.log("Draft post created at ", filePath);

  void openPostPreview(config, {
    title: initialTitle,
    slug: fileTitle,
    date: fileDate,
    filePath,
  }).catch((error) => {
    console.warn(`Could not open post preview: ${error}`);
  });

  const postContent = await openExistingFileInEditor(filePath);
  const parsedPost = matter(postContent);
  // TODO: validate post
  const { title, date } = parsedPost.data;

  // Handle undefined title and date
  const actualTitle = title || "untitled";
  const actualDate = date || new Date().toISOString();

  // Prompt user to save or discard
  const shouldSave = await confirm({
    message: `Save post "${actualTitle}"?`,
    default: true,
  });

  if (!shouldSave) {
    await rm(filePath, { force: true });
    console.log("Post discarded.");
    return;
  }

  console.log("The post has been saved! as ", filePath);
};
