#include <iostream>
#include <cmath>

// Base class
class Shape {
public:
    // Virtual method for calculating area
    virtual double area() const = 0;

    // Virtual destructor to allow derived class destructors to be called
    virtual ~Shape() {}
};

// Derived class: Circle
class Circle : public Shape {
private:
    double radius;

public:
    Circle(double r) : radius(r) {}

    // Override the area method to compute the area of a circle
    virtual double area() const override {
        return M_PI * radius * radius;
    }
};

// Derived class: Rectangle
class Rectangle : public Shape {
private:
    double width;
    double height;

public:
    Rectangle(double w, double h) : width(w), height(h) {}

    // Override the area method to compute the area of a rectangle
    virtual double area() const override {
        return width * height;
    }
};

// Function to display the area of a shape
void printArea(const Shape& shape) {
    std::cout << "Area: " << shape.area() << std::endl;
}

int main() {
    Circle circle(5.0);
    Rectangle rectangle(10.0, 2.0);

    // The same function, printArea, can operate on objects of different classes
    // and produce different results based on which class's area method is invoked.
    // This is an example of polymorphism.
    printArea(circle);       // Calls Circle::area
    printArea(rectangle);    // Calls Rectangle::area

    return 0;
}