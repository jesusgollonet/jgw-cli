#!/usr/bin/env bun

import select from "@inquirer/select";
import editor from "@inquirer/editor";
import confirm from "@inquirer/confirm";
import { writeFile } from "fs/promises";
import { getPosts, getPostByIndex } from "./list-posts";

interface PostChoice {
  name: string;
  value: number;
}

export async function editPost(includeDrafts: boolean = false) {
  const posts = await getPosts(includeDrafts);

  if (posts.length === 0) {
    console.log("No posts found.");
    return;
  }

  const choices: PostChoice[] = posts.map((post, index) => {
    const draftIndicator = post.draft ? " [DRAFT]" : "";
    const truncatedTitle =
      post.title.length > 50
        ? post.title.substring(0, 47) + "..."
        : post.title;

    return {
      name: `${index + 1}. ${truncatedTitle}${draftIndicator}`,
      value: index,
    };
  });

  const selectedIndex = await select({
    message: "Select post to edit:",
    choices,
    pageSize: 10,
    theme: {
      prefix: ">",
      helpMode: "never",
      style: {
        answer: (text: string) => text,
        message: (text: string) => text,
        error: (text: string) => text,
        defaultAnswer: (text: string) => text,
        help: (text: string) => text,
        highlight: (text: string) => text,
        key: (text: string) => text,
      },
    },
  });

  const postToEdit = await getPostByIndex(selectedIndex, includeDrafts);

  if (!postToEdit) {
    console.log("Error: Could not load the selected post.");
    return;
  }

  const editedContent = await editor({
    message: `Edit post: ${postToEdit.title}`,
    default: postToEdit.content,
    postfix: ".md",
  });

  if (editedContent === postToEdit.content) {
    console.log("No changes made.");
    return;
  }

  const shouldSave = await confirm({
    message: `Save changes to "${postToEdit.title}"?`,
    default: true,
  });

  if (!shouldSave) {
    console.log("Changes discarded.");
    return;
  }

  try {
    await writeFile(postToEdit.filePath, editedContent, "utf-8");
    console.log(`Post updated: ${postToEdit.filePath}`);
  } catch (error) {
    console.error(`Error saving post: ${error}`);
  }
}
