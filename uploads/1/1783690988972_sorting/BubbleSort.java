public class BubbleSort {

    public static void sort(int[] arr) {

        for (int i = 0; i < arr.length; i++) {

            for (int j = 0; j < arr.length - 1; j++) {

                if (arr[j] > arr[j + 1]) {

                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;

                }

            }

        }

    }

    public static void printArray(int[] arr) {

        for (int i = 0; i < arr.length; i++) {
            System.out.print(arr[i] + " ");
        }

        System.out.println();

    }

    public static void main(String[] args) {

        int[] numbers = {5, 1, 4, 2, 8, 3};

        System.out.println("Before Sorting:");
        printArray(numbers);

        sort(numbers);

        System.out.println("After Sorting:");
        printArray(numbers);

    }
}