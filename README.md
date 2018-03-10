# DegreeManager
A tool to manage degrees in the Higher Technical School of Computer Engineering of the spanish Rey Juan Carlos University.

Currently, it only support to crawl the URJC web page to donwload subject exams and process it in some ways.

# Webcrawler usage instructions

Open three terminals and execute the following commands:

## Start selenium server

<code>
$ cd webcrawler

$ java -jar selenium-server-standalone-3.10.0.jar
</code>

## Start TypeScript compiler 

With watch enabled to transpile to JavaScript on save:

<code>
$ cd webcrawler

$ ./node_modules/typescript/bin/tsc --watch
</code>

## Execute crawling or processing

<code>
$ cd webcrawler

$ node ./dist/Main.js
</code>

The main function can crawl the URJC web page and save the results in a JSON or load JSON data from the file.

Then, it can make some processing with the data downloaded.



