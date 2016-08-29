# Drone (as a dog)

## Idea

The idea is to make a drone follow a hand showed to the drone. It should also understand simple gestures (like open hand or fist) to control the movement.

*Disclaimer: This is work in progress. The code is messy to some extent.*


## Does it work?

Mostly. It recognices the position of the hand pretty good, even against the light and under bad light conditions. Gesture recognicition is still under process but already works ok. The controller which gives flight commands to the drone still needs adjustment (it works, but it's slow and not intuitive).

If someone wants to reproduce the hand recognition I can provide trained neural networks since I didn't upload the image database. Please contact me in this case. The hand recognicition works against a lot of backgrounds (need to extend the image library to improve that) and doesn't recognices the face or similar as hand.

I used the Parrot AR Drone 2.0 for development and test.


## Installation

You need to have installed:
```
python2.7
tensorflow (installation instructions on their website)
opencv2 (use pip or brew/apt)
pip install -r requirements.txt
node/npm for recording and labeling images (use brew/apt)
```

The scripts themselves don't require any installation.

## Record images
You can use any cam or video to record frames. The frames need to be in 640 x 360 pixel format for the labeling tool.

I used the drone to record frames: Connect to AR Drone 2.0, then do:
```bash
node record_images.js
```
The frames are saved into the `records/` directory.


## Label and crop the images

Make sure you followed the instructions in the previous paragraph.

```bash
node server.js
```
Now in your browser go to [http://localhost:3000/server/](http://localhost:3000/server/)

(TODO: change this. The 128 pixel size is an artifact from development.)
The images need to have 128 x 72 pixel size for the cropping to work. Resize multiple images to 128 pixels width (width:height ratio stays the same):
```bash
sips -Z 128 img_116.7.3_10.5*
```

To prepare training one needs to produce lots of 40x40 pixel images from the labeled ones. After labeling one can crop the images with:
```bash
python crop_images.py
```
All this crops go into `records_crop/{class_label}/`. `0` is for no hand. `1` is for hand.

I once tested adding generated images (from random colors) to the image database. They are generated by `python generate_iamges.py` and stored into `records_crop/0_gen/`. They are treated as "no hand" and increase generalization of the network.


## Train and use the neural network
It's recommended to have a lot of cropped images. I did ok with 10k. More is better as long as the images are not too similar to each other.

To train the network, set all the config in `convolutional.py` (like batch size and number of epochs) and then simply do:
```bash
python convolutional.py train
```
This will produce and save a traind convolutional neural network model (saved in `conv_model.ckpt` and `conv_model.ckpt.meta`).

To use the neural network with your webcam, after training run:
```bash
python convolutional.py
```
It should recognice your hand (only your hand!) or whatever you labeled in the tool.


## Fly drone
... (TODO)

```bash
python convolutional.py fly
``

## Improve the image database
With `compare_images.py`... theory behind it (papers)...


## Todo

* Tidy up the image database for better recognition
* Avoid too similar images before cropping (saves the use of `compare_images.py`)
* Maybe switch to ROS because of the lag and all the features 
* Get rid of drone cam to pc lag
* Better recognition of hand on the bottom of the cam (not the whole hand showing, when the drone should decline)
* Buy some 🍷 for stocking, coop has 20%

## Bugs/problems of extern libraries

* cv2.imread() only works for about 5000 images, then returns None
* Node.js async processes build a queue and are processed at the end of the main process

