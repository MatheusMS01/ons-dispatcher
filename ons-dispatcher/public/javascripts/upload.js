$(document).ready(function () {

   $("#simulator-input").on("change", function () {

      var file = $(this)[0].files[0];

      // Validation
      if(file.name.substr(file.name.length - 4, file.name.length) !== ".jar") {
         alert("Invalid file.");
         return;
      }

      upload(file, 'simulator');

      $("#simulator-span").text(file.name);
   });

   $("#configuration-input").on("change", function () {

      var file = $(this)[0].files[0];

      // Validation
      if(file.type !== 'text/xml') {
         alert("Invalid file.");
         return;
      }

      upload(file, 'configuration');

      $("#configuration-span").text(file.name);
   });

   $("#run").on("click", function () {
      $.ajax({
         type: "POST",
         url: "/run"
      });
   });

   function upload(file, type) {

      var formData = new FormData();

      formData.append('upload', file);
      formData.append('type', type);

      $.ajax({
         url: '/upload',
         type: 'POST',
         data: formData,
         processData: false,
         contentType: false
      });
   }

});