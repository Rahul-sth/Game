#include <iostream>
#include <cmath>

extern "C" {
    // Circle/Box bounding box collision detection engine written in C++
    bool check_collision(float px, float py, float pw, float ph, float ex, float ey, float er) {
        float closestX = std::max(px, std::min(ex, px + pw));
        float closestY = std::max(py, std::min(ey, py + ph));

        float distanceX = ex - closestX;
        float distanceY = ey - closestY;

        float distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
        return distanceSquared < (er * er);
    }
}