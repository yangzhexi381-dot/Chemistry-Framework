# H₂⁺: frozen hydrogen 1s LCAO model

Model ID: `h2plus.frozen_1s_lcao.v1`. Status: independently numerically checked within the specified basis; not a precision molecular calculation or experimental fit.

## Chemical object and boundaries

One electron and two protons, separated by R. Fixed-nucleus Born–Oppenheimer approximation, nonrelativistic, no external fields. Nuclear kinetic energy, vibrational zero-point energy and relativistic corrections are excluded. This is not neutral H₂.

All model inputs use atomic units: R,x,y,z in Bohr a₀; energy in Hartree Eh; density in a₀⁻³. Nuclear positions are (−R/2,0,0) and (R/2,0,0). Numerical support: 0.1 ≤ R ≤ 100. R=0 is singular and outside the basis conditioning range. The orbital exponent is fixed at 1/a₀, not optimized.

## Hamiltonian and variational problem

Electronic Hamiltonian h=−½∇²−1/rA−1/rB.
Normalized basis φA=π⁻¹/² exp(−rA), φB=π⁻¹/² exp(−rB).
Trial ψ=cAφA+cBφB. Stationarity of cᵀHc/(cᵀSc) gives Hc=εSc.

Analytical two-centre integrals (atomic units, ζ=1):

- S_AB=exp(−R)(1+R+R²/3), S_AA=S_BB=1.
- J=⟨A|−1/rB|A⟩=−1/R+exp(−2R)(1+1/R).
- C=⟨A|−1/rA|B⟩=−exp(−R)(1+R).
- H_AA=H_BB=−½+J; H_AB=H_BA=−½S_AB+C.

The atomic hydrogen eigen-equation gives the −½ terms. Symmetry makes (1,±1) simultaneous eigenvectors of H and S, so no general iterative eigensolver is needed:

εg/u=(H_AA±H_AB)/(1±S_AB), c=(1,±1)/√[2(1±S_AB)].
Total BO potential energy E_g/u=εg/u+1/R includes proton repulsion exactly once. Some sources put +1/R into the Hamiltonian before constructing its matrix; these conventions must not be mixed. Approximate electron number density ρ=|ψ|² integrates to one over all 3D space. It is not the signed charge density −eρ.

## Reproducible calculation and independent verification

Production uses analytical integrals in IEEE-754 double precision; there is no spatial quadrature discretization error in production. Conditioning worsens as R→0 because S→1; the supported lower bound avoids the nearly dependent basis. Curve sampling has a separate grid error: the UI estimates the minimum by 1000 samples over 2.3–2.7 a₀, with spacing ≈0.0004004 a₀; displayed digits are calculation output, not experimental precision.

At R=2 a₀:

| Quantity | Value |
|---|---:|
| S_AB | 0.5864528940253216 |
| H_AA / Eh | −0.9725265416668987 |
| H_AB / Eh | −0.6992322967224989 |
| E_g / Eh | −0.5537714953184827 |
| E_u / Eh | −0.16085396559668752 |

The test independently integrates in prolate spheroidal coordinates μ∈[1,1+40/R], ν∈[−1,1], rA/B=R(μ±ν)/2, with azimuth integrated out: d³r=(πR³/4)(μ²−ν²)dμdν. Gauss–Legendre orders 8→16→32 check convergence for S,J,C at R=.5,2,5; 32-point results agree with analytical matrix elements within 2×10⁻¹¹. The exponential tail is truncated after a factor exp(−40); these tests verify the selected distances, not a universal quadrature bound. Other tests verify Hc−εSc, cᵀSc=1, parity, midplane node, short-range repulsion and invalid inputs.

The fixed-basis ground curve minimum is near R=2.493 a₀, E=−0.564831 Eh; both states approach −0.5 Eh (H + H⁺) at dissociation. The minimum is a model result, not a measured bond length. A larger/optimized basis improves it; the present basis cannot describe the exact united-atom limit. Agreement of two numerical methods validates the integral implementation, not the completeness of the physical approximation.

## Interface interpretation

The energy plot shows total E_g/u versus R=1–10 a₀ and the −0.5 Eh asymptote. Inputs outside that plot range still receive numerical energies and a density slice, with a visible range notice. The density plot is ρ(x,0,0), not a one-dimensional probability distribution; its area does not equal one. The existing colored orbital lobes remain a phase illustration, separately labelled.

## Sources and convention check

- P. W. Percival, Simon Fraser University CHEM 260, lecture 12, pp. 1–3: https://www.sfu.ca/~percival/CHEM260/260-12.pdf . Primary teaching notes: variational principle, H₂⁺ secular determinant, overlap normalization; their Hamiltonian includes nuclear repulsion, whereas ours adds it after the electronic solve.
- Integral expressions are derived from the hydrogen 1s basis and independently spatially integrated in `tests/h2plus.test.cjs`. The numeric R=2 case and minimum above are reproducible calculations, not values attributed to that lecture or to experiment.
