import * as tf from "@tensorflow/tfjs";
import { lstm } from "@tensorflow/tfjs-layers/dist/exports_layers";

function generateDataset(size) {
  var dataSet = [];
}

const model = sequential();
const nStats = 20;

const xs = tf.tensor3d(inputs, [inputs.length, 82, nStats]);
const ys = tf
  .tensor3d(outputs, [outputs.length, 82, 1])
  .reshape([outputs.length, 82, 1]);

const input_layer_shape = 82;
const input_layer_neurons = 100;
model.add(
  tf.layers.dense({
    units: input_layer_neurons,
    inputShape: [input_layer_shape],
  })
);

const rnn_input_layer_features = 10;
const rnn_input_layer_timesteps =
  input_layer_neurons / rnn_input_layer_features;
const rnn_input_shape = [rnn_input_layer_timesteps, rnn_input_layer_features];
model.add(tf.layers.reshape({ targetShape: rnn_input_shape }));

const rnn_output_neurons = 20;

var lstm_cells = [];

for (let i = 0; i < n_layers; i++) {
  lstm_cells.push(tf.layers.lstmCell({ units: rnn_output_neurons }));
}
