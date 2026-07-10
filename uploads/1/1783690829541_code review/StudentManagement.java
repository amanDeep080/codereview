import java.util.ArrayList;
import java.util.Scanner;

class Student {
    private int id;
    private String name;
    private double marks;

    public Student(int id, String name, double marks) {
        this.id = id;
        this.name = name;
        this.marks = marks;
    }

    public int getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public double getMarks() {
        return marks;
    }

    public void setMarks(double marks) {
        this.marks = marks;
    }

    @Override
    public String toString() {
        return "ID: " + id +
               ", Name: " + name +
               ", Marks: " + marks;
    }
}

public class StudentManagement {

    private static ArrayList<Student> students = new ArrayList<>();

    public static void addStudent(int id, String name, double marks) {
        students.add(new Student(id, name, marks));
    }

    public static void displayStudents() {
        if (students.isEmpty()) {
            System.out.println("No students found.");
            return;
        }

        for (Student student : students) {
            System.out.println(student);
        }
    }

    public static Student findStudent(int id) {
        for (Student student : students) {
            if (student.getId() == id) {
                return student;
            }
        }
        return null;
    }

    public static void updateMarks(int id, double marks) {
        Student student = findStudent(id);

        if (student != null) {
            student.setMarks(marks);
            System.out.println("Marks updated successfully.");
        } else {
            System.out.println("Student not found.");
        }
    }

    public static void deleteStudent(int id) {
        Student student = findStudent(id);

        if (student != null) {
            students.remove(student);
            System.out.println("Student removed successfully.");
        } else {
            System.out.println("Student not found.");
        }
    }

    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);

        while (true) {

            System.out.println("\n===== Student Management =====");
            System.out.println("1. Add Student");
            System.out.println("2. Display Students");
            System.out.println("3. Update Marks");
            System.out.println("4. Delete Student");
            System.out.println("5. Exit");
            System.out.print("Enter choice: ");

            int choice = sc.nextInt();

            switch (choice) {

                case 1:
                    System.out.print("Enter ID: ");
                    int id = sc.nextInt();
                    sc.nextLine();

                    System.out.print("Enter Name: ");
                    String name = sc.nextLine();

                    System.out.print("Enter Marks: ");
                    double marks = sc.nextDouble();

                    addStudent(id, name, marks);
                    break;

                case 2:
                    displayStudents();
                    break;

                case 3:
                    System.out.print("Enter Student ID: ");
                    int updateId = sc.nextInt();

                    System.out.print("Enter New Marks: ");
                    double newMarks = sc.nextDouble();

                    updateMarks(updateId, newMarks);
                    break;

                case 4:
                    System.out.print("Enter Student ID: ");
                    int deleteId = sc.nextInt();

                    deleteStudent(deleteId);
                    break;

                case 5:
                    sc.close();
                    System.out.println("Goodbye!");
                    return;

                default:
                    System.out.println("Invalid choice.");
            }
        }
    }
}