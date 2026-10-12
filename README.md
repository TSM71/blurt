# Branch-Less Useless Ray-Tracer

People say branches on the GPU are the devil. I thought I'd take that to its logical conclusion.

Do not do this. This is not a good idea. I just thought it would be funny. It was.

Checked using godbolt, no branches in compiled output.

No camera controls other than FoV cuz I got lazy. Model is baked in for the same reason.
Just a PoC run with the VSCode shadertoy extension.

The ray bounces are broken, I am aware, I don't care, this was just a test for funsies.

1 ray per pixel. Average several frames yourself.
