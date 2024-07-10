#!/usr/bin/env node

import yargs, { Argv } from "yargs";
import { openEditor } from "./commands/new-post";
import { listPosts } from "./commands/list-posts";

yargs
  .scriptName("jgw")
  .usage("Usage: $0 <command> [options]")
  .command("post", "jgw post <subcommand>", (yargs: Argv) => {
    yargs
      .command(
        "new",
        "create new post",
        (yargs: Argv) => {
          yargs
            .option("title", {
              type: "string",
              default: "new post",
              describe: "Optional title of your new post",
            })
            .alias("t", "title");
        },
        async function (argv) {
          await openEditor(argv.title as string);
        },
      )
      .command(
        "list",
        "list all posts",
        (yargs: Argv) => {
          yargs
            .option("draft", {
              type: "boolean",
              default: false,
              describe: "include drafts",
            })
            .alias("d", "draft");
        },
        async function (argv) {
          await listPosts(argv.draft as boolean);
        },
      )
      .demandCommand(1)
      .strictCommands();
  })
  .demandCommand(1)
  .strictCommands()
  .help()
  .alias("h", "help").argv;
