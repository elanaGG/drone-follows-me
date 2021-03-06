#!/usr/bin/env python

# Copyright (c) 2011 Bastian Venthur
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.


"""Demo app for the AR.Drone.

This simple application allows to control the drone and see the drone's video
stream.
"""


import cv2
import numpy as np
import libardrone
import time


def main():
    W, H = 320, 240
    drone = libardrone.ARDrone()
    drone.speed = 0.2
    # drone.takeoff() # for security

    bat = drone.navdata.get(0, dict()).get('battery', 0)
    print('Battery: ' + str(bat))
    print(drone.navdata)

    running = True
    counter = 0
    while running and counter < 1:
        # print(type(drone.image))
        # print (len(drone.image))
        counter += 1

        if drone.image:
            img_arr = np.fromstring(drone.image, np.uint8)
            # print(len(img_arr))
            img_np = cv2.imdecode(img_arr, cv2.CV_LOAD_IMAGE_COLOR)
            cv2.imshow('drone front cam', img_np)
            cv2.waitKey(1)

        # break


        print ("start moving")
        drone.turn_left()
        time.sleep(1)
        drone.hover()
        time.sleep(1)
        drone.turn_right()
        time.sleep(1)
        drone.move_up()
        time.sleep(1)
        drone.move_down()


        # for event in pygame.event.get():
        #     if event.type == pygame.QUIT:
        #         running = False 
        #     elif event.type == pygame.KEYUP:
        #         drone.hover()
        #     elif event.type == pygame.KEYDOWN:
        #         if event.key == pygame.K_ESCAPE:
        #             drone.reset()
        #             running = False
        #         # takeoff / land
        #         elif event.key == pygame.K_RETURN:
        #             drone.takeoff()
        #         elif event.key == pygame.K_SPACE:
        #             drone.land()
        #         # emergency
        #         elif event.key == pygame.K_BACKSPACE:
        #             drone.reset()
        #         # forward / backward
        #         elif event.key == pygame.K_w:
        #             drone.move_forward()
        #         elif event.key == pygame.K_s:
        #             drone.move_backward()
        #         # left / right
        #         elif event.key == pygame.K_a:
        #             drone.move_left()
        #         elif event.key == pygame.K_d:
        #             drone.move_right()
        #         # up / down
        #         elif event.key == pygame.K_UP:
        #             drone.move_up()
        #         elif event.key == pygame.K_DOWN:
        #             drone.move_down()
        #         # turn left / turn right
        #         elif event.key == pygame.K_LEFT:
        #             drone.turn_left()
        #         elif event.key == pygame.K_RIGHT:
        #             drone.turn_right()
        #         # speed
        #         elif event.key == pygame.K_1:
        #             drone.speed = 0.1
        #         elif event.key == pygame.K_2:
        #             drone.speed = 0.2
        #         elif event.key == pygame.K_3:
        #             drone.speed = 0.3
        #         elif event.key == pygame.K_4:
        #             drone.speed = 0.4
        #         elif event.key == pygame.K_5:
        #             drone.speed = 0.5
        #         elif event.key == pygame.K_6:
        #             drone.speed = 0.6
        #         elif event.key == pygame.K_7:
        #             drone.speed = 0.7
        #         elif event.key == pygame.K_8:
        #             drone.speed = 0.8
        #         elif event.key == pygame.K_9:
        #             drone.speed = 0.9
        #         elif event.key == pygame.K_0:
        #             drone.speed = 1.0

        # try:
        #     surface = pygame.image.fromstring(drone.image, (W, H), 'RGB')
        #     # battery status
        #     hud_color = (255, 0, 0) if drone.navdata.get('drone_state', dict()).get('emergency_mask', 1) else (10, 10, 255)
        #     bat = drone.navdata.get(0, dict()).get('battery', 0)
        #     f = pygame.font.Font(None, 20)
        #     hud = f.render('Battery: %i%%' % bat, True, hud_color)
        #     screen.blit(surface, (0, 0))
        #     screen.blit(hud, (10, 10))
        # except:
        #     pass

        # pygame.display.flip()
        # clock.tick(50)
        # pygame.display.set_caption("FPS: %.2f" % clock.get_fps())

    print "Shutting down...",
    drone.land()
    time.sleep(1)
    drone.halt()
    print "Finished."

if __name__ == '__main__':
    main()

