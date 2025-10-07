Repository for the paper "It’s not Easy: Applying Supervised Machine Learning to Detect Malicious Extensions in the Chrome Web Store", published in the ACM Transactions on the Web (TWEB).

If you use any part of this codebase, you are kindly invited to cite our paper:

```
@article{rosenzweig2025not,
  title={{It’s not Easy: Applying Supervised Machine Learning to Detect Malicious Extensions in the Chrome Web Store}},
  author={Rosenzweig, Ben and Dalla Valle, Valentino and Apruzzese, Giovanni and Fass, Aurore},
  booktitle={ACM Transactions on the Web (TWEB)},
  year={2025}
}
```

The paper is accessible on the ACM Digital Library here: https://doi.org/10.1145/3770852 (and also on arXiv: https://arxiv.org/abs/2509.21590)

## Description

This repository contains the source code of our experimental evaluation. In particular, the source code provided here has been mostly developed by Ben Rosenzweig (during the course of his BSc. thesis, supervised by Aurore Fass) and by Giovanni Apruzzese. Such source code is organized in two folders:
* ``original_resources``  contains all the code developed by Ben Rosenzweig, and which covers most of the content of our paper. For instance, collecting the extensions, inspecting and preprocessing them into their feature representation, developing and tuning the classifiers---all such tasks have been mostly carried out by Ben Rosenzweig and the corresponding source code is provided in this folder. Inside the folder, you will find a comprehensive readme explaining how to use the various resources contained in this folder.
* ``notebooks`` contains the code developed by Giovanni Apruzzese, which carried out ancillary analyses based on the findings of Ben Rosenzweig. Inside this folder, you will find three jupyter notebooks reporting the experiments involving: the application of active learning, the longitudinal analyses, the tests with different values of the threshold and different balancing ratios, as well as the analyses for the detection of different categories of extensions and between MV3 and MV2. We also provide a fourth notebook specifically designed to kickstart new experiments using our resources. Also here, there is a readme explaining how to use the notebooks and the dataset. 

We stress that we cannot provide the source files of the extensions we considered, but we can provide the feature vector. Hence, our code/data can be considered as "ML-ready": the best way to kickstart novel experiments using supervised ML is downloading our dataset of extensions and replicating the experiments included in the ``notebooks`` folder, given that they are better to "dirty" one's own hands.

### Contact

For any inquiries, contact Ben Rosenzweig, Aurore Fass, or Giovanni Apruzzese.