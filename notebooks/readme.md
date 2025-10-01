## So you really want to dirty your hands?

This folder contains "three plus one" jupyter notebooks which include various experiments. We observe that the underlying source code, despite being "ML-ready" and despite being (in our opinion) quite intuitive (and commented), is far from being polished. There are just a few functions and there are a lot of repetitions.

Regardless, using the notebooks requires just scikit-learn (we used version 1.5.0, but any version is OK) and pandas. 


### The dataset

To use these notebooks, you must download the dataset, which you can grab from here: https://mega.nz/file/5At1GboT#VTZP-QvER9r1DTek5yidqr69xYtfMljWSc5SOLy2JQE. The dataset is around 100MB in compressed format, and 3GB uncompressed. 

Note: this dataset is DIFFERENT from the one linked in the ``original_resources`` folder. It contains the same extensions, but it is provided in a different format and it also includes the ID, the category, the author, and the manifest version (MV) of each sample. Aside from these "features", the dataset (provided in .csv format) already includes ALL features we extracted for each extension. This means that one can easily go from one classifier to another (or create new ones) by simply choosing which features in the dataframe to use.



### The notebooks

The main purpose of these notebooks is to make experiments easier by using a dataset in a "human-understandable" format, and also by using code that is commented and resembles an ML pipeline.

* ``activeLearning.ipynb`` this notebook contains the "active learning" experiments discussed in Section 7.2 of the paper. Please be aware that the experiments in this notebook can take up a lot of RAM (in our systems, it used almost all of the 32GB available). This is because we repeated the same operations over and over again, each time by testing the classifiers on new examples, which required to keep track of a lot of information. ```
* ``categories_and_manifest.ipynb`` this notebook contains the experiments discussed in Section 7.1 of the paper. Here, we also compute the five most important features for the combined classifier.
* ``thresholding_and_subsampling.ipynb`` this notebook contains the experiments discussed in Section 7.3 of the paper
* ``ML_draft.ipynb`` this notebook is an additional notebook we added to kickstart new experiments for future research. It simply loads the dataset, trains classifiers, and tests them on our dataset. You're free to use it as a blueprint for any sort of ML-related experiment using our resources




### Disclaimer

As a disclaimer, please note that 100% reproducibility is not possible due to intrinsic randomness of ML. Still, results should always converge to those reported in the paper. 