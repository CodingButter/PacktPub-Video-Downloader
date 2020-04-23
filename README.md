#PacktPub-Video-Course Downloader

## Installation:
   

     Git Clone https://github.com/JamieNichols/PacktPub-Video-Downloader.git
     cd PacktPub-Video-Downloader
     npm install

##Before You Begin
You must have a Packtpub account [Register Here](https://account.packtpub.com/register)
You can try out there 7 day trial. This may or may not work for paid courses once your trial begins

Then go to the Watch Now section of a course and add it to a playlist. Create a new playlist or add it to an existing. Once you have done this will all the VIDEO courses you want to download you are ready to use the Downloader. 
Remember your playlist title.

## How to use

Once you have cloned the repo and installed the modules all you have to do is run the following command

    node index.js --email [YourEmail] --password [YourPassword] --directory path/to/download/directory/ --playlist "Play list"

### I did not create any Error Catching.
If someone would like fork this and add error catching I am more than willing to merge their commits.

##MIT License

Copyright (c) [2020] [Jamie Nichols]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
