#include <iostream>
#include <string>
#include <vector>
 
class Cell {
    std::string dna;
    std::vector<std::string> proteins;
public:
    Cell(std::string dna) : dna(dna) {
        proteins = {"Hemoglobin", "Insulin"};
    }
    void mitosis() {
        std::cout << "Doing cell division";
        // Logic for cell division
    }
    void apoptosis() {
        // Logic for programmed cell death
    }
    std::string replicate_dna() {
        return dna + dna; // Method to interact with the encapsulated attribute
    }
};
 
int main() {
    Cell cell("ATCG");
    cell.mitosis(); // Public interface to initiate cell division 
    return 0;
} 