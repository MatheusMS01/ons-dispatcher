$(document).ready(function () {

   // TODO: reform this code in an smarter way
   $("#simulator-input").on("change", function () {
      var file = $(this)[0].files[0];

      $("#simulator-span").hide();
      $("#simulator-progress-bar").show();

      $("#simulator-progress-bar").text('0%');
      $("#simulator-progress-bar").width('0%');

      var formData = new FormData();

      // add the files to formData object for the data payload
      formData.append('uploads[]', file, file.name);

      $.ajax({
         url: '/simulation',
         type: 'POST',
         data: formData,
         processData: false,
         contentType: false,
         success: function(data){
            console.log('upload successful!\n' + data);
         },
         xhr: function() {
            // create an XMLHttpRequest
            var xhr = new XMLHttpRequest();

            // listen to the 'progress' event
            xhr.upload.addEventListener('progress', function(evt) {

               if (evt.lengthComputable) {
                  // calculate the percentage of upload completed
                  var percentComplete = evt.loaded / evt.total;
                  percentComplete = parseInt(percentComplete * 100);

                  // update the Bootstrap progress bar with the new percentage
                  $("#simulator-progress-bar").text(percentComplete + '%');
                  $("#simulator-progress-bar").width(percentComplete + '%');

                  // once the upload reaches 100%, set the progress bar text to done
                  if (percentComplete === 100) {
                     $("#simulator-progress-bar").hide();
                     $("#simulator-span").show();
                     $("#simulator-span").text(file.name);
                  }
               }
            }, false);
            return xhr;
         }
      });
   });

   $("#configuration-input").on("change", function () {
      var file = $(this)[0].files[0];

      $("#configuration-span").hide();
      $("#configuration-progress-bar").show();

      $("#configuration-progress-bar").text('0%');
      $("#configuration-progress-bar").width('0%');

      var formData = new FormData();

      // add the files to formData object for the data payload
      formData.append('uploads[]', file, file.name);

      $.ajax({
         url: '/simulation',
         type: 'POST',
         data: formData,
         processData: false,
         contentType: false,
         success: function(data){
            console.log('upload successful!\n' + data);
         },
         xhr: function() {
            // create an XMLHttpRequest
            var xhr = new XMLHttpRequest();

            // listen to the 'progress' event
            xhr.upload.addEventListener('progress', function(evt) {

               if (evt.lengthComputable) {
                  // calculate the percentage of upload completed
                  var percentComplete = evt.loaded / evt.total;
                  percentComplete = parseInt(percentComplete * 100);

                  // update the Bootstrap progress bar with the new percentage
                  $("#configuration-progress-bar").text(percentComplete + '%');
                  $("#configuration-progress-bar").width(percentComplete + '%');

                  // once the upload reaches 100%, set the progress bar text to done
                  if (percentComplete === 100) {
                     $("#configuration-progress-bar").hide();
                     $("#configuration-span").show();
                     $("#configuration-span").text(file.name);
                  }
               }
            }, false);

            return xhr;
         }
      });
   });

});