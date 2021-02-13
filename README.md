# Application for visualizing the value of securities

The application allows you to display on the chart the data added to the table on the value of securities by date.

### Data format

The input data must be entered in the format: the date in the format dd.mm.yyyy, enter a string as the company, the share price is a positive integer. 
You can't add two identical rows to a table.

### Working rules

1. By default, the table is filled with data from the example, you can delete them by clicking the button that appears to the right of
the selected row when you hover over it. 
You can also edit data in inline mode (directly in the table). 
When editing the data, you must enter the data in the correct format. 
If the data is changed incorrectly, you must first correct the error and then continue working.

2. When you click the add data button under the table, a modal window opens for entering data for a new row in the table. 
The data is entered in the same format as described in paragraph "Data format". 
If the input data is incorrect, you must correct the errors in the selected fields.

3. Based on the results of changes in the data in the table and when new data is added, the chart is updated.

### Created with

* [Chart.js](https://www.chartjs.org/docs/latest/) library
