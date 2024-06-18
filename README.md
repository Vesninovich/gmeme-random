# GMeme

Extension that shows you random picture from configured folder.

It is strongly recommended that folder contains memes so that you can use this extension to browse your meme collection at your leizure.

You can fill it with any pictures you want, of course.

## Installation

Built files are already included into repository so that there is no need to build them.

Just do

```bash
make install
```

You may need to restart Gnome shell after that for extension to be enabled.

Some memes for testing are already included in this repo, check `example-memes/`.

## Usage

Specify folder from which to get memes in extensions settings.

## Build

Install dependencies:

```bash
npm i
```

Build and install extension:

```bash
make && make install
```
