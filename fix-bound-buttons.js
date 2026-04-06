const fs = require('fs');
const filepath = 'src/app/agency/submissions/[id]/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// The closing div is currently around line 1000
// It looks like:
//               )} */}
//             </div>
//
//             {/* ================= BOUND (NEWLY BOUND) ================= */}

const toReplace = `              )} */}
            </div>

            {/* ================= BOUND (NEWLY BOUND) ================= */}`;

const replaceWith = `              )} */}

            {/* ================= BOUND (NEWLY BOUND) ================= */}`;

content = content.replace(toReplace, replaceWith);

// Now we need to add the closing div after the BOUND section ends.
// The END of the BOUND section looks like:
//                   </button>
//               </>
//             )}
//           </div>
//         </div>
//         {/* KEY INFO GRID ??? ISC STYLE */}

const endToReplace = `                  <button
                    onClick={handleCancelRequest}
                    className={iscOutlineBtn}
                  >
                    Cancel Quote
                  </button>
              </>
            )}
          </div>
        </div>`;

const endReplaceWith = `                  <button
                    onClick={handleCancelRequest}
                    className={iscOutlineBtn}
                  >
                    Cancel Quote
                  </button>
              </>
            )}
            </div> {/* END RIGHT BUTTONS */}
          </div>
        </div>`;

content = content.replace(endToReplace, endReplaceWith);

fs.writeFileSync(filepath, content);
console.log('Fixed BOUND buttons position!');
