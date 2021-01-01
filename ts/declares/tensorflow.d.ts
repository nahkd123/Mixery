declare namespace tf {
    /**
     * A mutable object, similar to tf.Tensor, that allows users to set values at locations before converting to an immutable tf.Tensor.
     *
     * See tf.buffer() for creating a tensor buffer.
     */
    export class TensorBuffer {
        /** Sets a value in the buffer at a given location. */
        set(value: number, ...locs: number[]): void;
        /** Returns the value in the buffer at the provided location. */
        get(...locs: number[]): number;
        /** Creates an immutable tf.Tensor object from the buffer. */
        toTensor(): Tensor;
    }

    /**
     * A tf.Tensor object represents an immutable, multidimensional array of numbers that has a shape and a data type.
     * 
     * See tf.tensor() for details on how to create a tf.Tensor.
     */
    export class Tensor {
        /** Returns a promise of tf.TensorBuffer that holds the underlying data. */
        buffer(): Promise<TensorBuffer>;
        /** Returns a tf.TensorBuffer that holds the underlying data. */
        bufferSync(): TensorBuffer;
        /** Returns the tensor data as a nested array. The transfer of data is done asynchronously. */
        array(): Promise<number[]>;
        /** Returns the tensor data as a nested array. The transfer of data is done synchronously. */
        arraySync(): number[];

        data(): Promise<any>;
        dataSync(): any;

        /** Disposes tf.Tensor from memory. */
        dispose(): void;
        /** Prints the tf.Tensor. See tf.print() for details. */
        print(verbose?: boolean): void;
        /** Returns a copy of the tensor. See tf.clone() for details. */
        clone(): Tensor;
        /** Returns a human-readable description of the tensor. Useful for logging. */
        toString(): string;
    }
    namespace layers {
        export class Layer {}
    }
    export class LayersModel {}
    export class Sequential extends LayersModel {}

    /** A mutable tf.Tensor, useful for persisting state, e.g. for training. */
    export class Variable extends Tensor {
        /** Assign a new tf.Tensor to this variable. The new tf.Tensor must have the same shape and dtype as the old tf.Tensor. */
        assign(newValue: Tensor): void;
    }

    export type NestedArray<T> = T[] | ArrayLike<T> | NestedArray<T>[] | ArrayLike<NestedArray<T>>;

    /** Creates a tf.Tensor with the provided values, shape and dtype. */
    export function tensor(
        values: NestedArray<number>,
        shape?: number[],
        dtype?: 'float32' | 'int32' | 'bool' | 'complex64' | 'string'
    ): Tensor;
    /**
     * Creates rank-0 tf.Tensor (scalar) with the provided value and dtype.
     * 
     * The same functionality can be achieved with tf.tensor(), but in general we recommend using tf.scalar() as it makes the code more readable.
     */
    export function scalar(
        value: number | boolean | string | Uint8Array,
        dtype?: 'float32' | 'int32' | 'bool' | 'complex64' | 'string'
    ): Tensor;
    export function tensor1d(
        values: NestedArray<number>,
        dtype?: 'float32' | 'int32' | 'bool' | 'complex64' | 'string'
    ): Tensor;
    export function tensor2d(
        values: NestedArray<number>,
        shape?: [number, number],
        dtype?: 'float32' | 'int32' | 'bool' | 'complex64' | 'string'
    ): Tensor;
    export function tensor3d(
        values: NestedArray<number>,
        shape?: [number, number, number],
        dtype?: 'float32' | 'int32' | 'bool' | 'complex64' | 'string'
    ): Tensor;
    export function tensor4d(
        values: NestedArray<number>,
        shape?: [number, number, number, number],
        dtype?: 'float32' | 'int32' | 'bool' | 'complex64' | 'string'
    ): Tensor;
    export function tensor5d(
        values: NestedArray<number>,
        shape?: [number, number, number, number, number],
        dtype?: 'float32' | 'int32' | 'bool' | 'complex64' | 'string'
    ): Tensor;
    export function tensor6d(
        values: NestedArray<number>,
        shape?: [number, number, number, number, number, number],
        dtype?: 'float32' | 'int32' | 'bool' | 'complex64' | 'string'
    ): Tensor;

    export function buffer(
        shape: number[],
        dtype?: "float32",
        value?: NestedArray<number>
    ): TensorBuffer;
    export function clone(t: Tensor): Tensor;
    export function complex(
        real: Tensor | NestedArray<number>,
        imaginary: Tensor | NestedArray<number>
    ): Tensor;

    export function print(
        x: Tensor,
        verbose?: boolean
    ): void;

    export function sequential(
        config?: {
            layers: layers.Layer[],
            name: string
        }
    ): Sequential;
}

