# It’s not easy: Examining the Extensions of the Chrome Web Store under a Security Lens
This repository contains the code for the [paper: "It’s not easy: Examining the Extensions of the Chrome Web Store under a Security Lens"]().

## Summary

This project can be used to:
- Download all available Chrome Extensions from the [Chrome Web Store](https://chromewebstore.google.com/) 
- Download Chrome Extensions that have been removed from the Chrome Web Store via [Chrome-Stats](https://chrome-stats.com/) (A Chrome-Stats API-Key is required)
- Unpack archived extension files using a slightly modified version of [DoubleX's unpack extensions script](https://github.com/Aurore54F/DoubleX/blob/main/src/unpack_extension.py)
- Extract metadata-based features for the detection of malicious extensions
- Extract source code-based features using [JaSt](https://github.com/Aurore54F/JaSt) 
- Combine metadata and source code-based features
- Build Random-Forest classifiers with the extracted features
## Requirements

- Python 3 (tested with version 3.10.6)
- Required Python packages can be installed using ``pip install -r requirements.txt``
- Node.js (tested with version 12.22.9) and NPM (tested with version 9.5.0)
- the Node.js module js-beautify installed via: ``npm -g install js-beautify``
## Usage

### Downloader

The downloader can download extensions from the [Chrome Web Store](https://chromewebstore.google.com/) or [Chrome-Stats](https://chrome-stats.com/). To download extensions from [Chrome-Stats](https://chrome-stats.com/) an API-Key is required. The API-Key must be entered in *chrome_stats\chrome_stats_requests.py* under *API_KEY*.
To obtain information on how to use the downloader type in:
```
python3 -m downloader.downloader 'OUTPUT' 'ERROR' 'APICALLS' -c -f 'FILTER' --id 'ID'
```
`'OUTPUT'` is the path to the output directory and `'ERROR'` is the path to a log file where errors are logged. With `-c` extensions are only downloaded from [Chrome-Stats](https://chrome-stats.com/)  and not from the [Chrome Web Store](https://chromewebstore.google.com/).  The `'FILTER'` is a path to a JSON file, containing filter arguments to download specific extensions using the advanced search from [Chrome-Stats](https://chrome-stats.com/). The JSON file should be structured as explained [here](https://docs.chrome-stats.com/api/api-reference#run-an-advanced-search-query-for-extensions-or-reviews). With `--id 'ID'` a single extension with the id 'ID' can be downloaded.



### Unpack Downloaded Extensions
To obtain information on how to unpack the downloaded extensions type in:
```
python3 -m DoubleX.unpack_extensions -s 'SOURCE' -d 'DIRECTORY' -d 'DESTINATION'
```
The `'SOURCE'` is the path to a single crx or zip extension file that should be unpacked. `'DIRECTORY'` is the path to a directory and can be used to unpack a whole directory of downloaded extensions. `'DESTINATION'` is the path to a directory within a single directory is created for the output of each extension.

### Extract Metadata Features

#### Reviews

First, for the extraction of metadata features we require the reviews of the extensions. All the reviews in the Chrome Web Store (including reviews of removed extensions) can be downloaded from [Chrome-Stats](https://chrome-stats.com/) [here](https://chrome-stats.com/raw-data). Then we need to convert the downloaded CSV file, containing the reviews, to a JSON file:
```
python3 -m metrics.csv_reviews_to_json 'PATH' 'OUTPUT'
```

#### Same Developer Count

Additionally, we need to obtain the 'Same Developer Count' (number of extensions published by the same developer) for every downloaded extension:
```
python3 -m metrics.get_same_dev_count 'DETAILS_PATH' 'OUTPUT' 'APICALLS'
```
The `'DETAILS_PATH'` is the path to the directory containing the downloaded extensions. The `'OUTPUT'` is the path to the output JSON file and `'APICALLS'` is the path to the JSON file containing information about how many API calls are already used for a specific day (specifying a non-existing path will create a new JSON file). This command will obtain the 'Same Developer Count' for all the extension inside the `'DETAILS_PATH'` directory.

#### Extract relevant data

To extract the relevant data for the metadata features use:
```
python3 -m metrics.metrics_extractor 'UNPACKED_PATH' 'DETAILS_PATH' 'SAME_DEV_COUNT_PATH' 'REVIEW_PATH' 'OUTPUT' 'THREADCOUNT'
```
The `'UNPACKED_PATH'` is the path to the directory containing the unpacked extensions. The metrics will be extracted from all the extensions within this directory. The `'SAME_DEV_COUNT_PATH'` is the path to the JSON file containing the 'Same Developer Count' for at least all the extensions within the `'UNPACKED_PATH'` directory. The `'REVIEW_PATH'` is the path to the JSON file containing the reviews. The `'OUTPUT'` is the path to a directory where all the relevant data should be stored (a single JSON file is created for each extension). `'THREADCOUNT'` is the amount of threads that should be used to extract the relevant data.

#### Datasets
To create different datasets (e.g. training and testing set) use:
```
python3 -m metrics.datasets 'UNPACKED_PATH' 'DETAILS_PATH' 'OUTPUT' -y 'YEAR' -yl 'YEAR_LIMIT' -p 'PERCENTAGE' -s -name1 'NAME1' -name2 'NAME2'
```
The `'OUTPUT'` is the path to the JSON output file. The `'YEAR'` can be used to split the set at a specific year. For example ``2019`` would split the extensions into two sets. The first set contains extensions that had their last update before 2019 and the second set consists of extensions that had their last update in 2019. The `'YEAR_LIMIT'` can be used to exclude extensions that had their last update in the specified year or after. The `'PERCENTAGE'` can only be used if 'YEAR' is not used. If `'PERCENTAGE'` is used, the first set will consist of `'PERCENTAGE'` extensions and the second set will consist of the remaining extensions. Values between 0.0 and 1.0 are valid. `-s` can be used to shuffle the extensions, otherwise the extensions are sorted after their last update date. `'NAME1'` and `'NAME2'` can be used to specify names for the two datasets. Defaults are `'trainingsSet'` and `'testSet'`.
To split the seemingly benign extensions into Dataset L and Dataset U use:
```
python3 -m metrics.datasets 'UNPACKED_PATH' 'DETAILS_PATH' 'OUTPUT' -y 2023 -name1 prior2023 -name2 after2023
```

#### Host-Permissions, Content-Script-Matches and Keywords
To obtain the most frequently used Host-Permissions, Content-Script-Matches and Keywords within the trainings set use:
```
python3 -m metrics.feature_determination 'BENIGN_DATASET' 'MALWARE_DATASET' 'METRICS_PATH' 'OUTPUT'
```
The `'BENIGN_DATASET'` is the path to the benign dataset JSON file that should be used and the `'MALWARE_DATASET'` is the path to the malicious dataset file (The name of the trainings set within these dataset files must be `'trainingsSet'`). The  `'METRICS_PATH'` is the path to the directory containing the extracted relevant data for both benign and malicious extension (the directory must contain two subdirectories `benign` and `malware`). `'OUTPUT'` is the path to a directory where the results will be stored. The `results.json` file that will be created within the `'OUTPUT'` directory is relevant in the next step.

#### Metadata Feature Extraction for each Dataset
To extract the metadata features for one dataset use:
```
python3 -m metrics.feature_extractor 'METRICS_PATH' 'BENIGN_METRICS_PATH' 'THREADCOUNT' 'BENIGN_UPDATE_LIST' 'KEYWORD_RESULTS' 'OUTPUT' -dataset 'DATASET' -n 'DATASET_NAME'
```
The `'METRICS_PATH'` is the path to the directory containing the relevant extracted data for the specified. The  `'BENIGN_METRICS_PATH'` is the path to the directory containing the relevant extracted data for the seemingly benign extensions (required for the `'Related Permission'`). The `'BENIGN_UPDATE_LIST'` is the path to the dataset JSON file, splitting the seemingly benign extensions into Dataset L and Dataset U (also required for the `'Related Permission'`). The `'KEYWORD_RESULTS'` are the path to the `results.json` file mentioned above. The `'DATASET'` is the path to the dataset file of which the features should be extracted. The `'DATASET_NAME'` is the name of the dataset within the `'DATASET'` file (e.g. `'trainingsSet'`).

### Source Code Feature Extraction
To extract features of the Source Code using [JaSt](https://github.com/Aurore54F/JaSt)  enter:
```
python3 -m metrics.source_code_features 'UNPACKED_PATH' 'OUTPUT' 'LOG' 'FAILED' -t 'THREADCOUNT'
```
The `'UNPACKED_PATH'` is the path to the directory containing the unpacked extensions. The `'OUTPUT'` is the path to a directory where each extension's source code features will be stored in a JSON file per extension. The `'LOG'` is a path to the log file. `'FAILED'` is the path to a directory where information about extensions is stored that could not be parsed.

To combine the source code features of extensions within the same dataset into a single JSON file use:
```
python3 -m metrics.merge_source_code_features 'DATASET' 'DATASET_NAME' 'SOURCE_CODE_FEATURES' 'OUTPUT'
```
The `'DATASET'` is the path to the dataset file of which the features should be extracted. The `'DATASET_NAME'` is the name of the dataset within the `'DATASET'` file. The `'SOURCE_CODE_FEATURES'` are the path to the directory containing the source code features of the extensions within the specified dataset.

### Combine Features
To combine metadata and source code-based features for a specific dataset use:
```
python3 -m metrics.combine_features 'METADATA_FEATURES' 'SOURCE_CODE_FEATURES' 'OUTPUT'
```
The `'METADATA_FEATURES'` are the path to the JSON file created with `metrics.feature_extractor` and the `'SOURCE_CODE_FEATURES'` are the path to the JSON file created with `'metrics.source_code_features'`. Only use the JSON files created on the same dataset.

### Classify Extensions and Detection of Malicious Extensions
To build the Random Forest classifiers and classify the extensions use:
```
python3 -m classifier.classifier 'BENIGN_TRAINING' 'MALWARE_TRAINING' 'TEST_SET' 'TEST_LABEL' -test_set1 'TEST_SET1' -test_label1 'TEST_LABEL1' -t 'THRESHOLD_VALUE' -fi
```
`'BENIGN_TRAINING'` is the path to one of the seemingly benign training feature sets JSON files (metadata, source code, and combined can be used). `'MALWARE_TRAINING'` is the path to one of malicious training feature sets. `'TEST_SET'` and `'TEST_SET1'` are the path to a test feature set file. `'TEST_LABEL'` and `'TEST_LABEL1'` are the label of the test set. Either `benign` or `malicious`. `'THRESHOLD_VALUE'` can be used to set the threshold value manually, otherwise 5-fold cross-validation is used to estimate the threshold value. With `-fi` the feature importance is displayed.

## Data availability

We provide the feature representation of our datasets, usable for ML-based experiments, in a dedicated archive (1.1GB): https://mega.nz/file/5E130JxC#XJjRtym8UWapr_oZZI66YnRWIpAKtgO197juP7HIeRk

## Active Learning experiments

We provide in the ```active_learning``` folder the resources for reproducing our active learning experiments. After installing the requirements, it is necessary to download the data (from the link provided above) and extract it in the ```feature_sets``` subfolder. Then, the code in the ```merge_data.ipynb``` must be run: in this way, the script will automatically create a new CSV file (of ~3GB) containing the feature representation (metadata and source code) of _all_ extensions, including their ID and date of last update. Such a CSV file will be used as input to the ```activeLearning.ipynb``` notebook. 

The ```activeLearning.ipynb``` notebook is configurable and it is possible to, e.g., change the number of extensions used to re-train the detectors (currently set to 15) or change the threshold needed to determine whether an extension is malicious or not. The notebook also provides the results of our experiments (with 15 extensions used for each retraining step).