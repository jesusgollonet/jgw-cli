#!/usr/bin/env bun

import confirm from "@inquirer/confirm";
import { writeFile } from "fs/promises";
import matter from "gray-matter";
import path from "path";
import { loadConfig } from "../config";
import { openInEditor } from "../lib/editor";

const postMetadata = (postName: string, postDate: string) => {
  return `---
title: '${postName}'
date: '${postDate}'
draft: true
---`;
};

export const openEditor = async (postTitle?: string) => {
  const config = await loadConfig();
  const postsDirectory = `${config.path}/build/posts/`;
  const postContent = await openInEditor(
    postMetadata(postTitle || "untitled", new Date().toISOString()),
    ".md",
  );
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
    console.log("Post discarded.");
    return;
  }

  // remove special chars from title. replace spaces with hyphens
  // if there are multiple spaces, replace with single hyphen
  const fileTitle = actualTitle
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
  const fileDate = actualDate.split("T")[0];
  const postFilename = `${fileDate}_${fileTitle}.md`;
  // check for defaults
  // save post now
  //
  const filePath = path.join(postsDirectory, postFilename);
  //TODO: check for name collision
  await writeFile(filePath, postContent, "utf8");
  console.log("The post has been saved! as ", filePath);
};
