#include <string>
#include <ostream>
#include <iostream>

class Car {
private:
    std::string make;
    std::string model;
    int year;

public:
    // Constructor with an initializer list to initialize the data members
    Car(const std::string& make, const std::string& model, int year)
        : make(make), model(model), year(year) {
    }

    // Example method to display car information
    void displayInfo() const {
       std::cout << "Make: " << make << ", Model: " << model << ", Year: " << year << std::endl;
    }
};

// The usage of the constructor would be like this:
int main() {
    Car myCar("Toyota", "Corolla", 2020);
    myCar.displayInfo();
    return 0;
}