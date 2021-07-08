let gProcessor = null;

// Show all exceptions to the user
OpenJsCad.AlertUserOfUncaughtExceptions();

$(function() {
  gProcessor = new OpenJsCad.Processor(document.getElementById("viewer"));
});

function updateSolid() {
  gProcessor.setJsCad(document.getElementById('code').value);
}
