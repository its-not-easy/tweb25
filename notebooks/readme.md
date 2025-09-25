## So you really want to dirty your hands?

This folder contains three jupyter notebooks which include various experiments. We observe that the underlying source code, despite being "ML-ready" and despite being (in our opinion) quite intuitive, is far from being polished. There are just a few functions and there are a lot of repetitions.


Regardless, using the notebooks requires just scikit-learn (we used version 1.5.0, but any version is OK) and pandas. You also need to download the dataset, which you can grab from here: https://mega.nz/file/5At1GboT#VTZP-QvER9r1DTek5yidqr69xYtfMljWSc5SOLy2JQE 

The dataset is around 100MB in compressed format, and 3GB uncompressed. Be aware that the experiments in the ``activeLearning.ipynb`` notebook can take up a lot of RAM (in our systems, it used almost all of the 32GB available). This is because we repeated the same operations over and over again, each time by testing the classifiers on new examples, which required to keep track of a lot of information. 