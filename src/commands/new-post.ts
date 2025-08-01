#!/usr/bin/env bun

import editor from "@inquirer/editor";
import confirm from "@inquirer/confirm";
import fs from "fs";
import matter from "gray-matter";
import { loadConfig } from "../config";

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
  const postContent = await editor({
    message: "Create a new post",
    default: postMetadata(postTitle || "untitled", new Date().toISOString()),
    postfix: ".md",
  });
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
  const filePath = `${postsDirectory}${postFilename}`;
  //TODO: check for name collision
  fs.writeFile(filePath, postContent, (err) => {
    if (err) throw err;
    console.log("The post has been saved! as ", filePath);
  });
};
